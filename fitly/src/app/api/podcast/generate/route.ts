import { NextResponse } from "next/server";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { podcastEpisodes } from "@/lib/db/schema";
import { generatePodcastScript } from "@/lib/podcast/script";
import { generatePodcastAudio } from "@/lib/podcast/tts";
import { uploadPodcastAudio } from "@/lib/podcast/storage";

// 헌법 §15 — 팟캐스트 생성은 script(gemini-3.1-pro-preview) → TTS(gemini-2.5-flash-preview-tts) → Storage 업로드 순.
// 헌법 §3.2 정직성 — 모든 episode default verified=false. 운영자 검수 후 true 갱신.
// 헌법 §35 백업 — 어떤 단계든 실패 시 정직 보고 (사용자에게 즉시 알림).
// 법률17 제28조 정합 — per-user 일일 생성 캡으로 Gemini 호출 비용 폭주 차단.
//   PODCAST_DAILY_LIMIT 초과 시 429 반환.
//
// 2026-05-18 — /review H2 fix (TOCTOU): advisory_xact_lock + placeholder
// INSERT 패턴으로 동시 호출이 cap 우회하지 못하도록 직렬화. 외부 IO 실패 시
// placeholder 자동 cleanup.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Vercel Hobby 60초 한도. TTS 한 번에 30~50초 소요 가능 — 한도 안에서 짧은 dialogue 우선.
export const maxDuration = 60;
export const preferredRegion = "icn1";

const PODCAST_DAILY_LIMIT = 5;
// pg_advisory_xact_lock per-user 네임스페이스 (streak freeze 와 분리).
const PODCAST_LOCK_NS = 1002;
const IS_PROD = process.env.NODE_ENV === "production";

function errorPayload(label: string, e: unknown): { error: string; detail?: string } {
  const detail = e instanceof Error ? e.message : String(e);
  return IS_PROD ? { error: label } : { error: label, detail };
}

type GenerateBody = {
  theme: string;
  scope?: "user" | "shared";
};

export async function POST(req: Request) {
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json(
      { error: "잘못된 JSON 본문" },
      { status: 400 },
    );
  }
  const theme = body.theme?.trim();
  if (!theme || theme.length < 4 || theme.length > 200) {
    return NextResponse.json(
      { error: "theme은 4~200자 내" },
      { status: 400 },
    );
  }
  const scope = body.scope === "shared" ? "shared" : "user";

  // 인증
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }
  // shared 생성은 service_role 만 — Phase 1 사용자 직접 X
  if (scope === "shared") {
    return NextResponse.json(
      { error: "공유 에피소드는 운영자만 생성 가능합니다" },
      { status: 403 },
    );
  }

  // 법률17 제28조 정합 — per-user 일일 캡.
  // /review H2 fix (TOCTOU): advisory_xact_lock + placeholder INSERT 로 slot
  // 점유. lock 안에서 count + INSERT 가 atomic이므로 동시 호출 불가능.
  const db = getDb();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  let episodeId: string;
  try {
    const claim = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${user.id}, ${PODCAST_LOCK_NS}))`,
      );
      const [row] = await tx
        .select({ n: count() })
        .from(podcastEpisodes)
        .where(
          and(
            eq(podcastEpisodes.userId, user.id),
            gte(podcastEpisodes.generatedAt, startOfDay),
          ),
        );
      const todayCount = Number(row?.n ?? 0);
      if (todayCount >= PODCAST_DAILY_LIMIT) {
        return { full: true } as const;
      }
      // slot claim — placeholder INSERT (scriptJson/audioUrl/durationSec NULL).
      // 외부 IO 실패 시 cleanup 으로 삭제하여 quota 회수.
      const [inserted] = await tx
        .insert(podcastEpisodes)
        .values({
          scope,
          userId: user.id,
          theme,
          verified: false,
        })
        .returning({ id: podcastEpisodes.id });
      if (!inserted?.id) throw new Error("INSERT returning id 실패");
      return { full: false, id: inserted.id } as const;
    });
    if (claim.full) {
      return NextResponse.json(
        {
          error: `오늘 생성 한도(${PODCAST_DAILY_LIMIT}회)를 초과하였습니다. 내일 다시 시도해 주세요.`,
        },
        { status: 429 },
      );
    }
    episodeId = claim.id;
  } catch (e) {
    console.error("[podcast/generate] quota claim error", e);
    return NextResponse.json(errorPayload("생성 가능 여부 확인 실패", e), {
      status: 500,
    });
  }

  // placeholder cleanup helper — 외부 IO 어느 단계든 실패 시 row 삭제하여
  // quota slot 회수 (다음 시도 가능).
  async function cleanupPlaceholder() {
    await db
      .delete(podcastEpisodes)
      .where(eq(podcastEpisodes.id, episodeId))
      .catch((delErr) => {
        console.error("[podcast/generate] cleanup delete failed", delErr);
      });
  }

  // Stage A: 스크립트 생성
  let script;
  try {
    script = await generatePodcastScript(theme);
  } catch (e) {
    console.error("[podcast/generate] script error", e);
    await cleanupPlaceholder();
    return NextResponse.json(errorPayload("스크립트 생성 실패", e), {
      status: 502,
    });
  }

  // Stage B: TTS
  let audioWav: Buffer;
  let durationSec: number;
  try {
    const r = await generatePodcastAudio(script);
    audioWav = r.audioWav;
    durationSec = r.durationSec;
  } catch (e) {
    console.error("[podcast/generate] tts error", e);
    await cleanupPlaceholder();
    return NextResponse.json(
      errorPayload("음성 합성 실패 (백업: 단일 화자 또는 다음 시도)", e),
      { status: 502 },
    );
  }

  // Stage C: scriptJson + durationSec 갱신 (placeholder 채움)
  try {
    await db
      .update(podcastEpisodes)
      .set({ scriptJson: script, durationSec })
      .where(eq(podcastEpisodes.id, episodeId));
  } catch (e) {
    console.error("[podcast/generate] script meta update error", e);
    await cleanupPlaceholder();
    return NextResponse.json(errorPayload("DB 기록 실패", e), {
      status: 500,
    });
  }

  // Stage D: Storage upload + audio_url update
  let audioUrl: string;
  try {
    audioUrl = await uploadPodcastAudio(audioWav, {
      scope,
      userId: user.id,
      episodeId,
    });
    await db
      .update(podcastEpisodes)
      .set({ audioUrl })
      .where(eq(podcastEpisodes.id, episodeId));
  } catch (e) {
    console.error("[podcast/generate] storage error", e);
    await cleanupPlaceholder();
    return NextResponse.json(
      errorPayload("Storage 업로드 실패 — 다시 시도해 주세요", e),
      { status: 502 },
    );
  }

  return NextResponse.json({
    episodeId,
    audioUrl,
    durationSec,
    summary: script.summary,
    verified: false,
  });
}
