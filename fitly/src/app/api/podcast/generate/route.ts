import { NextResponse } from "next/server";
import { and, count, eq, gte } from "drizzle-orm";
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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Vercel Hobby 60초 한도. TTS 한 번에 30~50초 소요 가능 — 한도 안에서 짧은 dialogue 우선.
export const maxDuration = 60;
export const preferredRegion = "icn1";

const PODCAST_DAILY_LIMIT = 5;
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
  const db = getDb();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  try {
    const [row] = await db
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
      return NextResponse.json(
        {
          error: `오늘 생성 한도(${PODCAST_DAILY_LIMIT}회)를 초과하였습니다. 내일 다시 시도해 주세요.`,
        },
        { status: 429 },
      );
    }
  } catch (e) {
    console.error("[podcast/generate] quota check error", e);
    // quota 조회 실패 시 안전한 쪽으로 차단.
    return NextResponse.json(errorPayload("생성 가능 여부 확인 실패", e), {
      status: 500,
    });
  }

  // Stage A: 스크립트 생성
  let script;
  try {
    script = await generatePodcastScript(theme);
  } catch (e) {
    console.error("[podcast/generate] script error", e);
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
    return NextResponse.json(
      errorPayload("음성 합성 실패 (백업: 단일 화자 또는 다음 시도)", e),
      { status: 502 },
    );
  }

  // Stage C: DB insert (episodeId 먼저 발급) + Storage upload + audio_url 갱신
  let episodeId: string;
  try {
    const [row] = await db
      .insert(podcastEpisodes)
      .values({
        scope,
        userId: user.id,
        theme,
        scriptJson: script,
        durationSec,
        verified: false,
      })
      .returning({ id: podcastEpisodes.id });
    if (!row?.id) throw new Error("INSERT returning id 실패");
    episodeId = row.id;
  } catch (e) {
    console.error("[podcast/generate] db insert error", e);
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
    // HIGH-001 — 고아 레코드 방지: storage 실패 시 INSERT한 row 삭제.
    await db
      .delete(podcastEpisodes)
      .where(eq(podcastEpisodes.id, episodeId))
      .catch((delErr) => {
        console.error("[podcast/generate] cleanup delete failed", delErr);
      });
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
