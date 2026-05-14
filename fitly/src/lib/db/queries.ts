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

import { cache } from "react";
import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  cards,
  examItems,
  examPapers,
  userCardHighlights,
  userCardState,
  userCardTags,
} from "@/lib/db/schema";
import { getSessionLabel } from "@/lib/exam/sessions";
import type { CardType } from "@/types";

const REVIEW_STATE_THRESHOLD = 2;

// 헌법 제37조 정합 — DB 일시 장애·RLS·마이그레이션 미적용 시 페이지 전체 SSR
// 실패를 막기 위한 그래스풀 디그레이드. 콘솔에는 명시적 보고, UI는 안전한
// fallback으로 동작 유지. 시드 미적재 상태도 동일 경로로 처리된다.
export async function safeRun<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error(`[db.queries] ${label} failed → fallback. cause=${msg}`);
    return fallback;
  }
}

export type CardCounts = {
  quizTotal: number;
  quizMastered: number;
  keywordTotal: number;
  keywordMastered: number;
  mistakeTotal: number;
  mistakeMastered: number;
};

const EMPTY_CARD_COUNTS: CardCounts = {
  quizTotal: 0,
  quizMastered: 0,
  keywordTotal: 0,
  keywordMastered: 0,
  mistakeTotal: 0,
  mistakeMastered: 0,
};

// React cache — 동일 request 내 중복 호출 자동 dedupe.
// /me 페이지가 getDashboardSummary + getLibraryCounts를 동시 호출하면서
// getCardCounts가 두 번 실행되던 부하를 한 번으로 축약 (Vercel function 시간 절약).
export const getCardCounts = cache(async (userId: string): Promise<CardCounts> => {
  return safeRun("getCardCounts", async () => {
    const db = getDb();

    const sharedRows = await db
      .select({
        type: cards.type,
        count: sql<number>`count(*)::int`,
      })
      .from(cards)
      .where(isNull(cards.userId))
      .groupBy(cards.type);

    const userOwnedRows = await db
      .select({
        type: cards.type,
        count: sql<number>`count(*)::int`,
      })
      .from(cards)
      .where(eq(cards.userId, userId))
      .groupBy(cards.type);

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
    const mastered = new Map<string, number>(
      masteredRows.map((r) => [r.type, r.count]),
    );

    return {
      quizTotal: totals.get("quiz") ?? 0,
      quizMastered: mastered.get("quiz") ?? 0,
      keywordTotal: totals.get("keyword") ?? 0,
      keywordMastered: mastered.get("keyword") ?? 0,
      mistakeTotal: totals.get("mistake") ?? 0,
      mistakeMastered: mastered.get("mistake") ?? 0,
    };
  }, EMPTY_CARD_COUNTS);
});

export type DueCardCounts = {
  quiz: number;
  keyword: number;
  mistake: number;
};

const EMPTY_DUE_COUNTS: DueCardCounts = { quiz: 0, keyword: 0, mistake: 0 };

// LEFT JOIN으로 user_card_state row가 *없는* 새 카드(NEW)도 포함한다.
//   - shared seed (cards.user_id IS NULL) → 모든 사용자에게 노출
//   - own mistake (cards.user_id = userId) → 본인에게만
//   - dueAt IS NULL (state row 없음) 또는 dueAt <= now → due
// 이렇게 하지 않으면 첫 학습 시 user_card_state가 비어 있어 어떤 카드도
// due로 잡히지 않는 닭과 달걀 상태에 갇힌다.
export const getDueCardCounts = cache(async (
  userId: string,
  now: Date = new Date(),
): Promise<DueCardCounts> => {
  return safeRun("getDueCardCounts", async () => {
    const db = getDb();
    const rows = await db
      .select({
        type: cards.type,
        count: sql<number>`count(*)::int`,
      })
      .from(cards)
      .leftJoin(
        userCardState,
        and(
          eq(userCardState.cardId, cards.id),
          eq(userCardState.userId, userId),
        ),
      )
      .where(
        and(
          or(isNull(cards.userId), eq(cards.userId, userId)),
          or(
            isNull(userCardState.dueAt),
            lte(userCardState.dueAt, now),
          ),
        ),
      )
      .groupBy(cards.type);

    const counts: DueCardCounts = { quiz: 0, keyword: 0, mistake: 0 };
    for (const row of rows) {
      if (
        row.type === "quiz" ||
        row.type === "keyword" ||
        row.type === "mistake"
      ) {
        counts[row.type] = row.count;
      }
    }
    return counts;
  }, EMPTY_DUE_COUNTS);
});

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
  return safeRun(
    `getDueCards(${type})`,
    async () => {
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
        .from(cards)
        .leftJoin(
          userCardState,
          and(
            eq(userCardState.cardId, cards.id),
            eq(userCardState.userId, userId),
          ),
        )
        .leftJoin(examItems, eq(cards.sourceItemId, examItems.id))
        .leftJoin(examPapers, eq(examItems.paperId, examPapers.id))
        .where(
          and(
            eq(cards.type, type),
            or(isNull(cards.userId), eq(cards.userId, userId)),
            or(
              isNull(userCardState.dueAt),
              lte(userCardState.dueAt, now),
            ),
          ),
        )
        // dueAt NULL(NEW)을 먼저 노출 → 첫 학습 시 새 카드가 보인다.
        // 그 다음 dueAt 오래된 순.
        .orderBy(sql`${userCardState.dueAt} asc nulls first`)
        .limit(limit);

      return rows.map((r) => ({
        id: r.id,
        type: r.type as CardType,
        frontText: r.frontText,
        frontImagePath: r.frontImagePath,
        backMd: r.backMd,
        verifiedAnswer: r.verifiedAnswer,
        dueAt: r.dueAt ?? now,
        paperLabel: formatPaperLabel(r.paperYear, r.paperSession, r.itemNo),
        itemFormat: r.itemFormat,
        itemPoints: r.itemPoints,
      }));
    },
    [],
  );
}

export function formatPaperLabel(
  year: number | null,
  session: string | null,
  itemNo: number | null,
): string | null {
  if (!year || !session || !itemNo) return null;
  return `${year}학년도 ${getSessionLabel(session)} ${itemNo}번`;
}

// 시드 카드 단건 조회 — 풀이 페이지·상세 화면용.
export type CardWithSource = DueCard;

export async function getCardById(
  userId: string,
  cardId: string,
): Promise<CardWithSource | null> {
  return safeRun(
    "getCardById",
    async () => {
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
          and(
            eq(userCardState.cardId, cards.id),
            eq(userCardState.userId, userId),
          ),
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
    },
    null,
  );
}

// 헌법 v3.5.1 제16조 — 사용자 형광펜/밑줄 조회. 카드 본문 인터랙션 다듬기 정합.
//
// 본 함수는 풀이/키워드/오답 카드 화면 hydrate 용. surface(back_md/front_text)
// 별로 묶지 않고 그대로 반환 — 렌더 후 클라이언트에서 surface 별 분기 wrap.
export type CardHighlight = {
  id: string;
  surface: "back_md" | "front_text";
  quote: string;
  prefix: string;
  suffix: string;
  color: "yellow" | "green" | "pink" | "underline";
  createdAt: Date;
};

export async function getCardHighlights(
  userId: string,
  cardId: string,
): Promise<CardHighlight[]> {
  return safeRun(
    `getCardHighlights(${cardId})`,
    async () => {
      const rows = await getDb()
        .select({
          id: userCardHighlights.id,
          surface: userCardHighlights.surface,
          quote: userCardHighlights.quote,
          prefix: userCardHighlights.prefix,
          suffix: userCardHighlights.suffix,
          color: userCardHighlights.color,
          createdAt: userCardHighlights.createdAt,
        })
        .from(userCardHighlights)
        .where(
          and(
            eq(userCardHighlights.userId, userId),
            eq(userCardHighlights.cardId, cardId),
          ),
        );
      return rows;
    },
    [],
  );
}

// 헌법 v3.5.1 제16조 — 사용자 커스텀 해시태그 조회. 카드 메타 다듬기 정합.
// 생성 순서대로 반환 (createdAt asc) — 칩 표시 순서 안정.
export type CardTag = {
  id: string;
  tag: string;
  createdAt: Date;
};

export async function getCardTags(
  userId: string,
  cardId: string,
): Promise<CardTag[]> {
  return safeRun(
    `getCardTags(${cardId})`,
    async () => {
      const rows = await getDb()
        .select({
          id: userCardTags.id,
          tag: userCardTags.tag,
          createdAt: userCardTags.createdAt,
        })
        .from(userCardTags)
        .where(
          and(
            eq(userCardTags.userId, userId),
            eq(userCardTags.cardId, cardId),
          ),
        )
        .orderBy(userCardTags.createdAt);
      return rows;
    },
    [],
  );
}

// 헌법 v3.5.1 제16조 — 오답노트 인쇄용 (다듬기). 사용자의 mistake 카드 전체 페치.
// limit 없이 전부 — 인쇄 데이터셋이라 due 필터 미적용.
// 정렬: 최근 합류 순 (cards.createdAt desc) — 최신 오답이 앞에 노출되어
// 출제연도 역순 시각과 정합.
export type MistakePrintCard = {
  id: string;
  frontText: string;
  backMd: string | null;
  verifiedAnswer: boolean;
  paperLabel: string | null;
  itemFormat: string | null;
  itemPoints: number | null;
};

export async function getMistakeCardsForPrint(
  userId: string,
): Promise<MistakePrintCard[]> {
  return safeRun(
    "getMistakeCardsForPrint",
    async () => {
      const db = getDb();
      const rows = await db
        .select({
          id: cards.id,
          frontText: cards.frontText,
          backMd: cards.backMd,
          verifiedAnswer: cards.verifiedAnswer,
          paperYear: examPapers.year,
          paperSession: examPapers.session,
          itemNo: examItems.itemNo,
          itemFormat: examItems.format,
          itemPoints: examItems.points,
          createdAt: cards.createdAt,
        })
        .from(cards)
        .leftJoin(examItems, eq(cards.sourceItemId, examItems.id))
        .leftJoin(examPapers, eq(examItems.paperId, examPapers.id))
        .where(and(eq(cards.type, "mistake"), eq(cards.userId, userId)))
        .orderBy(sql`${cards.createdAt} desc`);

      return rows.map((r) => ({
        id: r.id,
        frontText: r.frontText,
        backMd: r.backMd,
        verifiedAnswer: r.verifiedAnswer,
        paperLabel: formatPaperLabel(r.paperYear, r.paperSession, r.itemNo),
        itemFormat: r.itemFormat,
        itemPoints: r.itemPoints,
      }));
    },
    [],
  );
}
