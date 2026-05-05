import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { studyCards, mistakes } from "@/lib/db/schema";
import {
  fsrsCardFromState,
  fsrsCardToState,
  newCard,
  reviewCard,
  type ReviewGrade,
} from "@/lib/srs";

export const dynamic = "force-dynamic";

const VALID_GRADES: ReadonlySet<ReviewGrade> = new Set([
  "again",
  "hard",
  "good",
  "easy",
]);

type Body = {
  cardId?: string;
  grade?: string;
};

// 헌법 v1.11 제13조의2 1항 — study_cards SRS 리뷰 + 오답 자동 합류.
// "again" 또는 "hard" 시: 같은 내용을 mistakes 테이블에 동시 삽입(중복 방지 포함)하여
// /mistakes 노트로 합류시킨다.
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

  const cardId = body.cardId;
  const grade = body.grade as ReviewGrade | undefined;
  if (!cardId || !grade || !VALID_GRADES.has(grade)) {
    return NextResponse.json({ error: "cardId 또는 grade 가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(studyCards)
      .where(and(eq(studyCards.id, cardId), eq(studyCards.userId, user.id)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "카드를 찾을 수 없습니다." }, { status: 404 });
    }

    const now = new Date();
    const fsrs = row.srsState ? fsrsCardFromState(row.srsState, now) : newCard(now);
    const next = reviewCard(fsrs, grade, now);

    const isLapse = grade === "again";
    await db
      .update(studyCards)
      .set({
        srsState: fsrsCardToState(next.card),
        dueAt: next.card.due,
        reviewCount: row.reviewCount + 1,
        lapseCount: row.lapseCount + (isLapse ? 1 : 0),
        lastGrade: grade,
      })
      .where(eq(studyCards.id, cardId));

    // 오답 자동 합류: again/hard 시 mistakes 에 같은 내용 1회만 삽입.
    let promoted = false;
    if (grade === "again" || grade === "hard") {
      // 이미 같은 study_card 출신 mistakes 가 있는지 확인 (question 일치 + source='material')
      const existing = await db
        .select({ id: mistakes.id })
        .from(mistakes)
        .where(
          and(
            eq(mistakes.userId, user.id),
            eq(mistakes.question, row.question),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(mistakes).values({
          userId: user.id,
          question: row.question,
          choices: row.choices ?? null,
          answer: row.answer ?? null,
          explanation: row.explanation ?? null,
          keywords: row.keywords ?? [],
          source: "material",
          answerSource: row.answerSource as
            | "official"
            | "ai_estimate"
            | "user_self_corrected"
            | "crowd_verified",
          questionType: row.questionType ?? null,
        });
        promoted = true;
      }
    }

    return NextResponse.json({
      ok: true,
      promoted,
      due: next.card.due.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "리뷰 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
