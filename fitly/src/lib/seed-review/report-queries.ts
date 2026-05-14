// 헌법 시행규칙 33 §35 백업 매트릭스 — 운영자 신고 큐 쿼리 (코드리뷰 C.H2 후속).
// 2026-05-15. PR-6 에서 사용자 신고 채널을 도입했고 본 모듈은 그 운영자 측 큐.

import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { cardReports } from "@/lib/db/schema/card-reports";
import { cards } from "@/lib/db/schema/cards";
import { examItems } from "@/lib/db/schema/exam-items";
import { examPapers } from "@/lib/db/schema/exam-papers";
import type {
  CardReportCategory,
  CardReportStatus,
} from "@/lib/db/schema/card-reports";

export type ReportRow = {
  id: string;
  cardId: string;
  userId: string;
  category: CardReportCategory;
  detail: string | null;
  status: CardReportStatus;
  createdAt: Date;
  reviewedAt: Date | null;
  cardType: string | null;
  cardFrontText: string;
  cardBackPreview: string;
  paperLabel: string | null;
  itemNo: number | null;
};

export type ReportStats = {
  pending: number;
  reviewed: number;
  dismissed: number;
};

const CATEGORY_LABEL: Record<CardReportCategory, string> = {
  answer_wrong: "모범답안 오류",
  explanation_unclear: "해설 불명확",
  irrelevant: "본문 무관",
  other: "기타",
};

export function formatReportCategory(c: CardReportCategory): string {
  return CATEGORY_LABEL[c];
}

export async function getReportQueue(
  status: CardReportStatus = "pending",
  limit = 100,
): Promise<ReportRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: cardReports.id,
      cardId: cardReports.cardId,
      userId: cardReports.userId,
      category: cardReports.category,
      detail: cardReports.detail,
      status: cardReports.status,
      createdAt: cardReports.createdAt,
      reviewedAt: cardReports.reviewedAt,
      cardType: cards.type,
      cardFrontText: cards.frontText,
      cardBackMd: cards.backMd,
      paperYear: examPapers.year,
      paperSession: examPapers.session,
      itemNo: examItems.itemNo,
    })
    .from(cardReports)
    .innerJoin(cards, eq(cardReports.cardId, cards.id))
    .leftJoin(examItems, eq(cards.sourceItemId, examItems.id))
    .leftJoin(examPapers, eq(examItems.paperId, examPapers.id))
    .where(eq(cardReports.status, status))
    .orderBy(desc(cardReports.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    cardId: r.cardId,
    userId: r.userId,
    category: r.category as CardReportCategory,
    detail: r.detail,
    status: r.status as CardReportStatus,
    createdAt: r.createdAt,
    reviewedAt: r.reviewedAt,
    cardType: r.cardType,
    cardFrontText: r.cardFrontText
      ? r.cardFrontText.replace(/\s+/g, " ").trim().slice(0, 160)
      : "",
    cardBackPreview: r.cardBackMd
      ? r.cardBackMd.replace(/[#*`]/g, "").replace(/\s+/g, " ").trim().slice(0, 160)
      : "(답안 없음)",
    paperLabel:
      r.paperYear != null && r.paperSession
        ? `${r.paperYear}학년도 ${r.paperSession}`
        : null,
    itemNo: r.itemNo,
  }));
}

export async function getReportStats(): Promise<ReportStats> {
  const db = getDb();
  const rows = await db
    .select({
      status: cardReports.status,
      n: sql<number>`count(*)::int`,
    })
    .from(cardReports)
    .groupBy(cardReports.status);

  const out: ReportStats = { pending: 0, reviewed: 0, dismissed: 0 };
  for (const r of rows) {
    if (r.status === "pending") out.pending = Number(r.n);
    else if (r.status === "reviewed") out.reviewed = Number(r.n);
    else if (r.status === "dismissed") out.dismissed = Number(r.n);
  }
  return out;
}

// 카드 단위 신고 count — admin/seed-review 에 카드별 신고 누적 컬럼용.
export async function getReportCountsByCard(
  cardIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (cardIds.length === 0) return out;
  const db = getDb();
  const rows = await db
    .select({
      cardId: cardReports.cardId,
      n: sql<number>`count(*)::int`,
    })
    .from(cardReports)
    .where(eq(cardReports.status, "pending"))
    .groupBy(cardReports.cardId);
  for (const r of rows) {
    if (cardIds.includes(r.cardId)) out.set(r.cardId, Number(r.n));
  }
  return out;
}
