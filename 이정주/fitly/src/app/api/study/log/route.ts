import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { studySessions, learningLogs } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  mode?: "vocab" | "exam" | "review";
  durationSeconds?: number;
  cardsReviewed?: number;
  correctCount?: number;
  totalCount?: number;
};

// 헌법 v1.10 — 학습 세션 단위 기록.
// 클라이언트(/study/* 페이지)는 세션 종료 시 본 API에 1회 POST한다.
// learning_logs 일자별 누적도 함께 갱신한다(대시보드 추이 차트 원천).
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }

  const mode = body.mode;
  if (!mode || !["vocab", "exam", "review"].includes(mode)) {
    return NextResponse.json({ error: "mode 가 올바르지 않습니다." }, { status: 400 });
  }
  const durationSeconds = Math.max(0, Math.round(body.durationSeconds ?? 0));
  const cardsReviewed = Math.max(0, Math.round(body.cardsReviewed ?? 0));
  const correctCount = Math.max(0, Math.round(body.correctCount ?? 0));
  const totalCount = Math.max(0, Math.round(body.totalCount ?? 0));

  try {
    const db = getDb();

    await db.insert(studySessions).values({
      userId: user.id,
      mode,
      endedAt: new Date(),
      durationSeconds,
      cardsReviewed,
      correctCount,
      totalCount,
    });

    // 일자별 학습 로그 upsert
    const today = new Date().toISOString().slice(0, 10);
    const accuracy =
      totalCount > 0 ? Number(((correctCount / totalCount) * 100).toFixed(2)) : null;
    const studyMinutes = Math.round(durationSeconds / 60);

    await db
      .insert(learningLogs)
      .values({
        userId: user.id,
        logDate: today,
        accuracy: accuracy != null ? String(accuracy) : null,
        studyMinutes,
        cardsReviewed,
      })
      .onConflictDoUpdate({
        target: [learningLogs.userId, learningLogs.logDate],
        set: {
          studyMinutes: sql`${learningLogs.studyMinutes} + ${studyMinutes}`,
          cardsReviewed: sql`${learningLogs.cardsReviewed} + ${cardsReviewed}`,
          accuracy: accuracy != null ? String(accuracy) : learningLogs.accuracy,
        },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "저장 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
