"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
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

  // again/hard 평가 시 mistake 합류 (제13조의2 5항) — D-S2 이후 reimplement.
  // 현 단계는 user_card_state만 갱신.

  revalidatePath("/study/quiz");
  revalidatePath("/study/keyword");
  revalidatePath("/study/mistake");
  revalidatePath("/study-plan");
  revalidatePath("/dashboard");
}
