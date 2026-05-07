import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { podcastProgress, podcastEpisodes } from "@/lib/db/schema";

// 헌법 v3.0 §13의3 4항 — 청취 진척 저장 (재개 가능).
// throttle은 클라이언트에서 (5초마다 호출) — 서버는 단순 upsert.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProgressBody = {
  episodeId: string;
  currentSec: number;
  completed?: boolean;
};

export async function POST(req: Request) {
  let body: ProgressBody;
  try {
    body = (await req.json()) as ProgressBody;
  } catch {
    return NextResponse.json({ error: "잘못된 JSON" }, { status: 400 });
  }
  if (
    !body.episodeId ||
    typeof body.currentSec !== "number" ||
    body.currentSec < 0 ||
    body.currentSec > 86400
  ) {
    return NextResponse.json({ error: "유효성 실패" }, { status: 400 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const db = getDb();
  // 본인이 접근 가능한 episode 인지 확인 (shared 모두, user 본인만)
  const [ep] = await db
    .select({ scope: podcastEpisodes.scope, userId: podcastEpisodes.userId })
    .from(podcastEpisodes)
    .where(eq(podcastEpisodes.id, body.episodeId))
    .limit(1);
  if (!ep) {
    return NextResponse.json({ error: "에피소드 없음" }, { status: 404 });
  }
  if (ep.scope === "user" && ep.userId !== user.id) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  // upsert
  const completedAt = body.completed ? new Date() : null;
  await db
    .insert(podcastProgress)
    .values({
      userId: user.id,
      episodeId: body.episodeId,
      currentSec: Math.floor(body.currentSec),
      completedAt,
    })
    .onConflictDoUpdate({
      target: [podcastProgress.userId, podcastProgress.episodeId],
      set: {
        currentSec: Math.floor(body.currentSec),
        // completedAt은 한번 set되면 유지 (NULL로 되돌리지 않음)
        completedAt: sql`coalesce(${podcastProgress.completedAt}, ${completedAt})`,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const episodeId = url.searchParams.get("episodeId");
  if (!episodeId) {
    return NextResponse.json({ error: "episodeId 필요" }, { status: 400 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }
  const db = getDb();
  const [row] = await db
    .select()
    .from(podcastProgress)
    .where(
      and(
        eq(podcastProgress.userId, user.id),
        eq(podcastProgress.episodeId, episodeId),
      ),
    )
    .limit(1);
  return NextResponse.json({
    currentSec: row?.currentSec ?? 0,
    completedAt: row?.completedAt?.toISOString() ?? null,
  });
}
