"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { cards, userAttempts, userCardState } from "@/lib/db/schema";
import type { SrsState } from "@/types";

// 헌법 v3.0 제13조의2 — 학습 활동 server actions.
// 답안 저장 + 자가 채점 등급 처리 (현 시점은 단순 spaced repetition,
// ts-fsrs 본격 통합은 D-S2 이후 reimplement — 헌법 제19조 정합).

type Grade = "again" | "hard" | "good" | "easy";

const DAY_MS = 24 * 60 * 60 * 1000;

// FSRS state 갱신은 ts-fsrs 라이브러리 통합 후 본격 reimplement.
// 현 단계는 grade에 따른 단순 인터벌만 적용 (impl placeholder).
const GRADE_INTERVAL_MS: Record<Grade, number> = {
  again: 60 * 1000,
  hard: 10 * 60 * 1000,
  good: 1 * DAY_MS,
  easy: 3 * DAY_MS,
};

export async function submitAnswer(
  cardId: string,
  answerText: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  if (answerText.trim().length === 0) return;

  const db = getDb();
  const [card] = await db
    .select({ sourceItemId: cards.sourceItemId })
    .from(cards)
    .where(eq(cards.id, cardId))
    .limit(1);
  if (!card?.sourceItemId) return;

  await db.insert(userAttempts).values({
    userId: user.id,
    itemId: card.sourceItemId,
    answerMd: answerText,
  });
}

export async function gradeCard(cardId: string, grade: Grade): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const db = getDb();
  const now = new Date();
  const intervalMs = GRADE_INTERVAL_MS[grade];
  const dueAt = new Date(now.getTime() + intervalMs);

  // ts-fsrs state placeholder — 라이브러리 통합 시 src/lib/srs/index.ts를 통해 갱신.
  const fsrsState: SrsState = {
    due: dueAt.toISOString(),
    stability: grade === "easy" ? 3 : grade === "good" ? 1 : 0.5,
    difficulty: grade === "easy" ? 3 : grade === "again" ? 8 : 5,
    elapsed_days: 0,
    scheduled_days: intervalMs / DAY_MS,
    reps: 1,
    lapses: grade === "again" ? 1 : 0,
    state: grade === "again" ? 1 : 2,
    last_review: now.toISOString(),
  };

  // 원본 카드 정보 조회 — type / sourceItemId / 본문은 mistake 합류 시 사용.
  const [origCard] = await db
    .select({
      type: cards.type,
      sourceItemId: cards.sourceItemId,
      frontText: cards.frontText,
      frontImagePath: cards.frontImagePath,
      backMd: cards.backMd,
      verifiedText: cards.verifiedText,
      verifiedAnswer: cards.verifiedAnswer,
    })
    .from(cards)
    .where(eq(cards.id, cardId))
    .limit(1);

  // 원본 카드 user_card_state 갱신.
  await db
    .insert(userCardState)
    .values({
      userId: user.id,
      cardId,
      fsrsState,
      dueAt,
      lastReviewedAt: now,
    })
    .onConflictDoUpdate({
      target: [userCardState.userId, userCardState.cardId],
      set: {
        fsrsState,
        dueAt,
        lastReviewedAt: now,
        updatedAt: now,
      },
    });

  // 헌법 v3.3 제13조의2 5항 — again/hard 평가 시 mistake 트랙 자동 합류.
  // 정책:
  //   1) origCard.type 이 quiz/keyword + grade 가 again/hard 일 때만 합류
  //   2) origCard.type === "mistake" 는 이미 합류된 카드라 skip
  //   3) origCard.sourceItemId 가 NULL 이면 시드 outlier 라 skip
  //   4) 동일 (userId, sourceItemId, type=mistake) 가 이미 있으면 중복 생성 X
  //   5) keyword 원본은 정리 노트(LLM) 이므로 mistake 본문으로 부적합 →
  //      동일 sourceItemId 의 shared quiz 카드(PDF 원본 본문) 찾아 사용.
  //      shared quiz 없으면 keyword 본문 그대로 fallback.
  //   6) 생성된 mistake 카드는 user_card_state 에 dueAt=now 로 추가 (즉시 풀이 대상).
  if (
    origCard?.sourceItemId &&
    (grade === "again" || grade === "hard") &&
    (origCard.type === "quiz" || origCard.type === "keyword")
  ) {
    const [existingMistake] = await db
      .select({ id: cards.id })
      .from(cards)
      .where(
        and(
          eq(cards.sourceItemId, origCard.sourceItemId),
          eq(cards.type, "mistake"),
          eq(cards.userId, user.id),
        ),
      )
      .limit(1);

    if (!existingMistake) {
      // mistake 본문 — quiz 는 원본 그대로, keyword 는 sibling quiz 우선
      let mistakeBody = {
        frontText: origCard.frontText,
        frontImagePath: origCard.frontImagePath,
        backMd: origCard.backMd,
        verifiedText: origCard.verifiedText,
        verifiedAnswer: origCard.verifiedAnswer,
      };

      if (origCard.type === "keyword") {
        const [siblingQuiz] = await db
          .select({
            frontText: cards.frontText,
            frontImagePath: cards.frontImagePath,
            backMd: cards.backMd,
            verifiedText: cards.verifiedText,
            verifiedAnswer: cards.verifiedAnswer,
          })
          .from(cards)
          .where(
            and(
              eq(cards.sourceItemId, origCard.sourceItemId),
              eq(cards.type, "quiz"),
              isNull(cards.userId),
            ),
          )
          .limit(1);
        if (siblingQuiz) mistakeBody = siblingQuiz;
      }

      const [created] = await db
        .insert(cards)
        .values({
          type: "mistake",
          sourceItemId: origCard.sourceItemId,
          userId: user.id,
          ...mistakeBody,
        })
        .returning({ id: cards.id });

      if (created?.id) {
        await db
          .insert(userCardState)
          .values({
            userId: user.id,
            cardId: created.id,
            fsrsState: {
              due: now.toISOString(),
              stability: 0.5,
              difficulty: 6,
              elapsed_days: 0,
              scheduled_days: 0,
              reps: 0,
              lapses: 0,
              state: 0,
              last_review: now.toISOString(),
            },
            dueAt: now,
            lastReviewedAt: null,
          })
          .onConflictDoNothing({
            target: [userCardState.userId, userCardState.cardId],
          });
      }
    }
  }

  revalidatePath("/study/quiz");
  revalidatePath("/study/keyword");
  revalidatePath("/study/mistake");
  revalidatePath("/study-plan");
  revalidatePath("/dashboard");
}
