// 헌법 v3.0 제9조·제13조의2 정합 — cards 다형 테이블 + user_card_state 통합 query.
// D-S1.5 stub 해제 (dashboard/queries.ts의 quiz/keyword 0 처리 대체).
//
// FSRS state 정의 (ts-fsrs):
//   0 = New, 1 = Learning, 2 = Review, 3 = Relearning
// 마스터 = state ≥ 2 (Review 안정 단계 도달).
//
// 시드 카드 모델:
//   - quiz/keyword: user_id IS NULL (모든 사용자 공유)
//   - mistake:      user_id NOT NULL (개인 합류 — quiz 등급 again/hard 자동 합류)
// FSRS 상태는 user_card_state 1:1.

import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  cards,
  examItems,
  examPapers,
  userCardState,
} from "@/lib/db/schema";
import type { CardType } from "@/types";

const REVIEW_STATE_THRESHOLD = 2;

export type CardCounts = {
  quizTotal: number;
  quizMastered: number;
  keywordTotal: number;
  keywordMastered: number;
  mistakeTotal: number;
  mistakeMastered: number;
};

export async function getCardCounts(userId: string): Promise<CardCounts> {
  const db = getDb();

  // 시드 카드(공유) 전체 카운트 — type별
  const sharedRows = await db
    .select({
      type: cards.type,
      count: sql<number>`count(*)::int`,
    })
    .from(cards)
    .where(isNull(cards.userId))
    .groupBy(cards.type);

  // 사용자 본인 카드(주로 mistake) 카운트
  const userOwnedRows = await db
    .select({
      type: cards.type,
      count: sql<number>`count(*)::int`,
    })
    .from(cards)
    .where(eq(cards.userId, userId))
    .groupBy(cards.type);

  // 마스터 카운트 — user_card_state.fsrs_state.state ≥ 2
  const masteredRows = await db
    .select({
      type: cards.type,
      count: sql<number>`count(*)::int`,
    })
    .from(userCardState)
    .innerJoin(cards, eq(userCardState.cardId, cards.id))
    .where(
      and(
        eq(userCardState.userId, userId),
        sql`(${userCardState.fsrsState}->>'state')::int >= ${REVIEW_STATE_THRESHOLD}`,
      ),
    )
    .groupBy(cards.type);

  const totals = new Map<string, number>();
  for (const row of sharedRows) totals.set(row.type, row.count);
  for (const row of userOwnedRows) {
    totals.set(row.type, (totals.get(row.type) ?? 0) + row.count);
  }
  const mastered = new Map<string, number>(masteredRows.map((r) => [r.type, r.count]));

  return {
    quizTotal: totals.get("quiz") ?? 0,
    quizMastered: mastered.get("quiz") ?? 0,
    keywordTotal: totals.get("keyword") ?? 0,
    keywordMastered: mastered.get("keyword") ?? 0,
    mistakeTotal: totals.get("mistake") ?? 0,
    mistakeMastered: mastered.get("mistake") ?? 0,
  };
}

export type DueCardCounts = {
  quiz: number;
  keyword: number;
  mistake: number;
};

export async function getDueCardCounts(
  userId: string,
  now: Date = new Date(),
): Promise<DueCardCounts> {
  const db = getDb();
  const rows = await db
    .select({
      type: cards.type,
      count: sql<number>`count(*)::int`,
    })
    .from(userCardState)
    .innerJoin(cards, eq(userCardState.cardId, cards.id))
    .where(
      and(
        eq(userCardState.userId, userId),
        sql`${userCardState.dueAt} <= ${now}`,
      ),
    )
    .groupBy(cards.type);

  const counts: DueCardCounts = { quiz: 0, keyword: 0, mistake: 0 };
  for (const row of rows) {
    if (row.type === "quiz" || row.type === "keyword" || row.type === "mistake") {
      counts[row.type] = row.count;
    }
  }
  return counts;
}

export type DueCard = {
  id: string;
  type: CardType;
  frontText: string;
  frontImagePath: string | null;
  backMd: string | null;
  verifiedAnswer: boolean;
  dueAt: Date;
  paperLabel: string | null; // "2024학년도 교직논술 1번"
  itemFormat: string | null;
  itemPoints: number | null;
};

export async function getDueCards(
  userId: string,
  type: CardType,
  limit = 20,
  now: Date = new Date(),
): Promise<DueCard[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: cards.id,
      type: cards.type,
      frontText: cards.frontText,
      frontImagePath: cards.frontImagePath,
      backMd: cards.backMd,
      verifiedAnswer: cards.verifiedAnswer,
      dueAt: userCardState.dueAt,
      paperYear: examPapers.year,
      paperSession: examPapers.session,
      itemNo: examItems.itemNo,
      itemFormat: examItems.format,
      itemPoints: examItems.points,
    })
    .from(userCardState)
    .innerJoin(cards, eq(userCardState.cardId, cards.id))
    .leftJoin(examItems, eq(cards.sourceItemId, examItems.id))
    .leftJoin(examPapers, eq(examItems.paperId, examPapers.id))
    .where(
      and(
        eq(userCardState.userId, userId),
        eq(cards.type, type),
        sql`${userCardState.dueAt} <= ${now}`,
      ),
    )
    .orderBy(userCardState.dueAt)
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    type: r.type as CardType,
    frontText: r.frontText,
    frontImagePath: r.frontImagePath,
    backMd: r.backMd,
    verifiedAnswer: r.verifiedAnswer,
    dueAt: r.dueAt,
    paperLabel: formatPaperLabel(r.paperYear, r.paperSession, r.itemNo),
    itemFormat: r.itemFormat,
    itemPoints: r.itemPoints,
  }));
}

export function formatPaperLabel(
  year: number | null,
  session: string | null,
  itemNo: number | null,
): string | null {
  if (!year || !session || !itemNo) return null;
  const sessionLabel =
    session === "essay"
      ? "교직논술"
      : session === "A"
        ? "교육과정 A"
        : session === "B"
          ? "교육과정 B"
          : session === "combined"
            ? "통합"
            : session;
  return `${year}학년도 ${sessionLabel} ${itemNo}번`;
}

// 시드 카드 단건 조회 — 풀이 페이지·상세 화면용.
export type CardWithSource = DueCard;

export async function getCardById(
  userId: string,
  cardId: string,
): Promise<CardWithSource | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: cards.id,
      type: cards.type,
      frontText: cards.frontText,
      frontImagePath: cards.frontImagePath,
      backMd: cards.backMd,
      verifiedAnswer: cards.verifiedAnswer,
      dueAt: userCardState.dueAt,
      paperYear: examPapers.year,
      paperSession: examPapers.session,
      itemNo: examItems.itemNo,
      itemFormat: examItems.format,
      itemPoints: examItems.points,
    })
    .from(cards)
    .leftJoin(
      userCardState,
      and(eq(userCardState.cardId, cards.id), eq(userCardState.userId, userId)),
    )
    .leftJoin(examItems, eq(cards.sourceItemId, examItems.id))
    .leftJoin(examPapers, eq(examItems.paperId, examPapers.id))
    .where(eq(cards.id, cardId))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    type: row.type as CardType,
    frontText: row.frontText,
    frontImagePath: row.frontImagePath,
    backMd: row.backMd,
    verifiedAnswer: row.verifiedAnswer,
    dueAt: row.dueAt ?? new Date(),
    paperLabel: formatPaperLabel(row.paperYear, row.paperSession, row.itemNo),
    itemFormat: row.itemFormat,
    itemPoints: row.itemPoints,
  };
}
