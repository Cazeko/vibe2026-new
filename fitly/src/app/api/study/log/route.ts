import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { studySessions, learningLogs } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

// 헌법 v3.0 제9조·제13조의2 — 학습 세션 단위 기록.
// 클라이언트(/study/[track]) 는 세션 종료 시 본 API에 1회 POST한다.
// learning_logs 일자별 누적도 함께 갱신한다(대시보드 추이 차트 원천).
//
// 법률17 제28조 정합 — 단일 세션 상한:
//   durationSeconds  ≤ 6시간  (21600s)
//   cardsReviewed    ≤ 2000장
//   correct/total    ≤ 2000장
// 클라이언트가 비정상 값을 보내도 학습 통계가 폭주하지 않도록 서버 단에서 차단.
const BodySchema = z.object({
  mode: z.enum(["quiz", "keyword", "mistake"]),
  durationSeconds: z.number().int().min(0).max(21600).optional(),
  cardsReviewed: z.number().int().min(0).max(2000).optional(),
  correctCount: z.number().int().min(0).max(2000).optional(),
  totalCount: z.number().int().min(0).max(2000).optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    // dev 환경에서만 zod issues 노출 (스키마 누설 차단).
    const body: Record<string, unknown> = { error: "요청 본문 검증 실패" };
    if (process.env.NODE_ENV !== "production") {
      body.issues = parsed.error.issues;
    }
    return NextResponse.json(body, { status: 400 });
  }
  const { mode } = parsed.data;
  const durationSeconds = parsed.data.durationSeconds ?? 0;
  const cardsReviewed = parsed.data.cardsReviewed ?? 0;
  const correctCount = parsed.data.correctCount ?? 0;
  const totalCount = parsed.data.totalCount ?? 0;

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
    // 법률17 제28조 정합 — 외부 응답은 상수 메시지, 상세는 서버 로그만.
    console.error("[api/study/log] insert error", err);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
