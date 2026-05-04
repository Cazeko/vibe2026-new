import { NextResponse } from "next/server";
import { and, asc, eq, lte } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { studyCards } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 헌법 v1.11 제13조의2 1항 — SRS 통합 큐의 study_cards 슬라이스.
// /study/exam 페이지에서 사용자가 풀 다음 학습 카드들을 가져온다.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const db = getDb();
    const now = new Date();
    const items = await db
      .select()
      .from(studyCards)
      .where(and(eq(studyCards.userId, user.id), lte(studyCards.dueAt, now)))
      .orderBy(asc(studyCards.dueAt))
      .limit(20);

    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
