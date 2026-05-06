// 헌법 v3.4 시행규칙층 (rules/) — D-S9 운영자 검토 큐 쿼리.
// 대상: exam_items.verified_answer = false 레코드 (제18조의2 검증 라벨 정합).
// 본문(stem_text/stem_image_path)은 verified_text=true 자동 (v3.3 9항).

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { examItems } from "@/lib/db/schema/exam-items";
import { examPapers } from "@/lib/db/schema/exam-papers";

export type ReviewQueueRow = {
  id: string;
  paperId: string;
  year: number;
  session: string;
  itemNo: number;
  format: string | null;
  domains: string[];
  bloom: string | null;
  answerPreview: string;
  verifiedAnswer: boolean;
};

export async function getReviewQueue(limit = 100): Promise<ReviewQueueRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: examItems.id,
      paperId: examItems.paperId,
      year: examPapers.year,
      session: examPapers.session,
      itemNo: examItems.itemNo,
      format: examItems.format,
      domains: examItems.domains,
      bloom: examItems.bloom,
      answerMd: examItems.answerMd,
      verifiedAnswer: examItems.verifiedAnswer,
    })
    .from(examItems)
    .innerJoin(examPapers, eq(examItems.paperId, examPapers.id))
    .where(eq(examItems.verifiedAnswer, false))
    .orderBy(desc(examPapers.year), examPapers.session, examItems.itemNo)
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    paperId: r.paperId,
    year: r.year,
    session: r.session,
    itemNo: r.itemNo,
    format: r.format,
    domains: r.domains ?? [],
    bloom: r.bloom,
    answerPreview: previewOf(r.answerMd),
    verifiedAnswer: r.verifiedAnswer,
  }));
}

export type ReviewItemDetail = {
  id: string;
  paperId: string;
  year: number;
  session: string;
  itemNo: number;
  stemText: string;
  stemImagePath: string | null;
  points: number | null;
  format: string | null;
  domains: string[];
  bloom: string | null;
  keywords: string[];
  answerMd: string | null;
  explanationMd: string | null;
  verifiedText: boolean;
  verifiedAnswer: boolean;
};

export async function getReviewItemDetail(
  id: string
): Promise<ReviewItemDetail | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: examItems.id,
      paperId: examItems.paperId,
      year: examPapers.year,
      session: examPapers.session,
      itemNo: examItems.itemNo,
      stemText: examItems.stemText,
      stemImagePath: examItems.stemImagePath,
      points: examItems.points,
      format: examItems.format,
      domains: examItems.domains,
      bloom: examItems.bloom,
      keywords: examItems.keywords,
      answerMd: examItems.answerMd,
      explanationMd: examItems.explanationMd,
      verifiedText: examItems.verifiedText,
      verifiedAnswer: examItems.verifiedAnswer,
    })
    .from(examItems)
    .innerJoin(examPapers, eq(examItems.paperId, examPapers.id))
    .where(eq(examItems.id, id))
    .limit(1);

  const r = rows[0];
  if (!r) return null;
  return {
    ...r,
    domains: r.domains ?? [],
    keywords: r.keywords ?? [],
  };
}

export type ReviewQueueStats = {
  total: number;
  pending: number;
  verified: number;
};

export async function getReviewQueueStats(): Promise<ReviewQueueStats> {
  const db = getDb();
  const all = await db.select({ id: examItems.id }).from(examItems);
  const pending = await db
    .select({ id: examItems.id })
    .from(examItems)
    .where(eq(examItems.verifiedAnswer, false));
  return {
    total: all.length,
    pending: pending.length,
    verified: all.length - pending.length,
  };
}

function previewOf(text: string | null): string {
  if (!text) return "(답안 없음)";
  const cleaned = text.replace(/^#+\s*/gm, "").replace(/\n+/g, " ").trim();
  return cleaned.length > 80 ? cleaned.slice(0, 80) + "…" : cleaned;
}

// 헌법 v3.4 정합: and import는 향후 복합 필터(연도·영역) 도입 시 사용.
void and;
