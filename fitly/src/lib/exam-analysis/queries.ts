// 헌법 v3.5 제13조의2·제18조의3 정합 — 기출 분석 4탭(papers·analysis·topic·roadmap) 데이터 페이지.
// 시드 미적재 / DB 일시 장애 시 모든 함수는 safeRun fallback으로 빈 결과를 반환한다 (제35조의2 4항).
// React cache()로 동일 request 내 중복 호출 dedupe — /exam-analysis 가 4탭 모두 단일 페이지에서 분기되므로
// paperList + domainHeatmap 같은 query 가 다른 helper 안에서도 재사용될 수 있다.

import { cache } from "react";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { cutScores } from "@/lib/db/schema";
import { safeRun } from "@/lib/db/queries";

// ── 공통 타입 ──────────────────────────────────────────────────────────────

export type PaperRow = {
  id: string;
  year: number;
  session: string;          // 'essay' | 'A' | 'B' | 'combined'
  itemCount: number;
  totalPoints: number;
  verifiedTextCount: number;
  verifiedAnswerCount: number;
  verified: boolean;        // examPapers.verified
};

export type ItemRow = {
  id: string;
  itemNo: number;
  format: string | null;
  bloom: string | null;
  points: number | null;
  domains: string[];
  keywords: string[];
  stemImagePath: string | null;
  stemTextPreview: string;  // stem_text 첫 80자
  stemTextFull: string;     // 백승환 #4 (2026-05-13) — 전체 본문 텍스트
  answerMd: string | null;
  explanationMd: string | null;
  verifiedAnswer: boolean;
};

export type HeatmapMatrix = {
  rows: string[];           // y축 라벨 (영역·Bloom·형식)
  years: number[];          // x축 학년도 (오름차순)
  cells: number[][];        // [rowIdx][yearIdx] = count
  rowTotals: number[];      // 각 row 합계
  yearTotals: number[];     // 각 year 합계
  max: number;              // 셀 최댓값 (정규화용)
};

export type KeywordTone = {
  keyword: string;
  count: number;
};

export type DomainKeyword = {
  domain: string;
  keywords: KeywordTone[];
};

export type CutScoreRow = {
  region: string;
  year: number;
  appliedCount: number | null;
  applicantCount: number | null;
  competitionRatio: number | null;
  firstRoundCutScore: number | null;
  verified: boolean;
  sourceNote: string | null;
};

export type RoadmapEntry = {
  domain: string;
  itemCount: number;
  yearsCovered: number;     // 출제 학년도 수
  recencyScore: number;     // 최근 5년 가중치 0~1
  grade: "S" | "A" | "B" | "C";
  reason: string;
};

// ── 1. paperList — papers 탭 ───────────────────────────────────────────────

export const getPaperList = cache(async (): Promise<PaperRow[]> => {
  return safeRun(
    "exam-analysis getPaperList",
    async () => {
      const db = getDb();
      // examPapers + examItems aggregate join
      const rows = await db.execute<{
        id: string;
        year: number;
        session: string;
        item_count: number;
        total_points: number;
        verified_text_count: number;
        verified_answer_count: number;
        verified: boolean;
      }>(sql`
        select
          ep.id::text as id,
          ep.year::int as year,
          ep.session as session,
          count(ei.id)::int as item_count,
          coalesce(sum(ei.points), 0)::int as total_points,
          count(*) filter (where ei.verified_text)::int as verified_text_count,
          count(*) filter (where ei.verified_answer)::int as verified_answer_count,
          ep.verified as verified
        from exam_papers ep
        left join exam_items ei on ei.paper_id = ep.id
        group by ep.id, ep.year, ep.session, ep.verified
        order by ep.year desc, ep.session asc
      `);
      return rows.map((r) => ({
        id: r.id,
        year: r.year,
        session: r.session,
        itemCount: r.item_count,
        totalPoints: r.total_points,
        verifiedTextCount: r.verified_text_count,
        verifiedAnswerCount: r.verified_answer_count,
        verified: r.verified,
      }));
    },
    [] as PaperRow[],
  );
});

// ── 2. paperItems — papers 탭 상세 ─────────────────────────────────────────

export const getPaperItems = cache(async (paperId: string): Promise<ItemRow[]> => {
  return safeRun(
    "exam-analysis getPaperItems",
    async () => {
      const db = getDb();
      // 백승환 #4 (2026-05-13) — stem_text 전체 로드 (Lightbox 텍스트 병렬용).
      // 시험지 평균 8문항 × stem 평균 1KB = ~8KB SSR 페이로드 증가. 안전 범위.
      const rows = await db.execute<{
        id: string;
        item_no: number;
        format: string | null;
        bloom: string | null;
        points: number | null;
        domains: string[] | null;
        keywords: string[] | null;
        stem_image_path: string | null;
        stem_preview: string;
        stem_text: string;
        answer_md: string | null;
        explanation_md: string | null;
        verified_answer: boolean;
      }>(sql`
        select
          id::text as id,
          item_no,
          format,
          bloom,
          points,
          domains,
          keywords,
          stem_image_path,
          left(stem_text, 80) as stem_preview,
          stem_text,
          answer_md,
          explanation_md,
          verified_answer
        from exam_items
        where paper_id = ${paperId}::uuid
        order by item_no asc
      `);
      return rows.map((r) => ({
        id: r.id,
        itemNo: r.item_no,
        format: r.format,
        bloom: r.bloom,
        points: r.points,
        domains: Array.isArray(r.domains) ? r.domains : [],
        keywords: Array.isArray(r.keywords) ? r.keywords : [],
        stemImagePath: r.stem_image_path,
        stemTextPreview: r.stem_preview ?? "",
        stemTextFull: r.stem_text ?? "",
        answerMd: r.answer_md,
        explanationMd: r.explanation_md,
        verifiedAnswer: r.verified_answer,
      }));
    },
    [] as ItemRow[],
  );
});

// ── 3. heatmaps — analysis 탭 ──────────────────────────────────────────────

type AggRow = { row: string; year: number; cnt: number };

function buildMatrix(rows: AggRow[]): HeatmapMatrix {
  const rowSet = new Set<string>();
  const yearSet = new Set<number>();
  for (const r of rows) {
    if (r.row) rowSet.add(r.row);
    if (r.year != null) yearSet.add(r.year);
  }
  const rowList = [...rowSet].sort();
  const yearList = [...yearSet].sort((a, b) => a - b);
  const cells: number[][] = rowList.map(() => yearList.map(() => 0));
  let max = 0;
  for (const r of rows) {
    if (!r.row || r.year == null) continue;
    const ri = rowList.indexOf(r.row);
    const yi = yearList.indexOf(r.year);
    if (ri < 0 || yi < 0) continue;
    cells[ri][yi] = r.cnt;
    if (r.cnt > max) max = r.cnt;
  }
  const rowTotals = cells.map((row) => row.reduce((s, v) => s + v, 0));
  const yearTotals = yearList.map((_, yi) =>
    cells.reduce((s, row) => s + row[yi], 0),
  );
  return { rows: rowList, years: yearList, cells, rowTotals, yearTotals, max };
}

// 의미 순서가 있는 row(Bloom 6단계, 형식 4종)를 정렬한다. 기본 unicode sort
// 결과를 알파벳/한글이 아니라 *교육적 순서*로 재배치한다 — 사용자가 진도/난이도
// 인식을 자연스럽게 하기 위함.
function reorderMatrix(matrix: HeatmapMatrix, order: string[]): HeatmapMatrix {
  if (matrix.rows.length === 0) return matrix;
  const indexMap = new Map(matrix.rows.map((r, i) => [r, i]));
  const ordered = order.filter((r) => indexMap.has(r));
  const others = matrix.rows.filter((r) => !order.includes(r));
  const newRows = [...ordered, ...others];
  const newCells = newRows.map((r) => matrix.cells[indexMap.get(r)!]);
  const newRowTotals = newRows.map(
    (r) => matrix.rowTotals[indexMap.get(r)!],
  );
  return {
    ...matrix,
    rows: newRows,
    cells: newCells,
    rowTotals: newRowTotals,
  };
}

// 사고 수준(낮음 → 높음). 미분류는 마지막에 자동 합류.
const BLOOM_ORDER = ["기억", "이해", "적용", "분석", "평가", "창작"];

// 출제 부담(낮음 → 높음). 객관식 시대(2002~2013) 흡수 + 서술/논술 시대(2014~)까지 포괄.
const FORMAT_ORDER = ["객관식", "단답형", "서술형", "논술형"];

export const getDomainHeatmap = cache(async (): Promise<HeatmapMatrix> => {
  return safeRun(
    "exam-analysis getDomainHeatmap",
    async () => {
      const db = getDb();
      const rows = await db.execute<{ domain: string; year: number; cnt: number }>(sql`
        select
          d.value as domain,
          ep.year::int as year,
          count(*)::int as cnt
        from exam_items ei
        join exam_papers ep on ep.id = ei.paper_id
        cross join lateral jsonb_array_elements_text(ei.domains) as d(value)
        group by d.value, ep.year
      `);
      return buildMatrix(rows.map((r) => ({ row: r.domain, year: r.year, cnt: r.cnt })));
    },
    buildMatrix([]),
  );
});

export const getBloomHeatmap = cache(async (): Promise<HeatmapMatrix> => {
  return safeRun(
    "exam-analysis getBloomHeatmap",
    async () => {
      const db = getDb();
      const rows = await db.execute<{ bloom: string | null; year: number; cnt: number }>(sql`
        select
          coalesce(ei.bloom, '미분류') as bloom,
          ep.year::int as year,
          count(*)::int as cnt
        from exam_items ei
        join exam_papers ep on ep.id = ei.paper_id
        group by ei.bloom, ep.year
      `);
      const matrix = buildMatrix(
        rows.map((r) => ({ row: r.bloom ?? "미분류", year: r.year, cnt: r.cnt })),
      );
      return reorderMatrix(matrix, BLOOM_ORDER);
    },
    buildMatrix([]),
  );
});

export const getFormatHeatmap = cache(async (): Promise<HeatmapMatrix> => {
  return safeRun(
    "exam-analysis getFormatHeatmap",
    async () => {
      const db = getDb();
      const rows = await db.execute<{ format: string | null; year: number; cnt: number }>(sql`
        select
          coalesce(ei.format, '미분류') as format,
          ep.year::int as year,
          count(*)::int as cnt
        from exam_items ei
        join exam_papers ep on ep.id = ei.paper_id
        group by ei.format, ep.year
      `);
      const matrix = buildMatrix(
        rows.map((r) => ({ row: r.format ?? "미분류", year: r.year, cnt: r.cnt })),
      );
      return reorderMatrix(matrix, FORMAT_ORDER);
    },
    buildMatrix([]),
  );
});

// ── 4. topicCloud — topic 탭 ───────────────────────────────────────────────

export const getKeywordCloud = cache(async (limit = 60): Promise<KeywordTone[]> => {
  return safeRun(
    "exam-analysis getKeywordCloud",
    async () => {
      const db = getDb();
      const rows = await db.execute<{ keyword: string; cnt: number }>(sql`
        select
          k.value as keyword,
          count(*)::int as cnt
        from exam_items ei
        cross join lateral jsonb_array_elements_text(ei.keywords) as k(value)
        where length(trim(k.value)) > 0
        group by k.value
        order by cnt desc, k.value asc
        limit ${limit}
      `);
      return rows.map((r) => ({ keyword: r.keyword, count: r.cnt }));
    },
    [] as KeywordTone[],
  );
});

export const getDomainKeywords = cache(
  async (perDomain = 8): Promise<DomainKeyword[]> => {
    return safeRun(
      "exam-analysis getDomainKeywords",
      async () => {
        const db = getDb();
        const rows = await db.execute<{
          domain: string;
          keyword: string;
          cnt: number;
          rnk: number;
        }>(sql`
          with paired as (
            select d.value as domain, k.value as keyword, count(*)::int as cnt
            from exam_items ei
            cross join lateral jsonb_array_elements_text(ei.domains) as d(value)
            cross join lateral jsonb_array_elements_text(ei.keywords) as k(value)
            where length(trim(d.value)) > 0 and length(trim(k.value)) > 0
            group by d.value, k.value
          ),
          ranked as (
            select domain, keyword, cnt,
                   row_number() over (partition by domain order by cnt desc, keyword asc) as rnk
            from paired
          )
          select domain, keyword, cnt, rnk::int as rnk
          from ranked
          where rnk <= ${perDomain}
          order by domain asc, rnk asc
        `);
        const grouped = new Map<string, KeywordTone[]>();
        for (const r of rows) {
          if (!grouped.has(r.domain)) grouped.set(r.domain, []);
          grouped.get(r.domain)!.push({ keyword: r.keyword, count: r.cnt });
        }
        return [...grouped.entries()]
          .map(([domain, keywords]) => ({ domain, keywords }))
          .sort((a, b) => a.domain.localeCompare(b.domain));
      },
      [] as DomainKeyword[],
    );
  },
);

// ── 5. roadmap — roadmap 탭 ───────────────────────────────────────────────
//
// 등급 산식 (헌법 제3조의2 정합 — 합격 컷·확률 추정 X):
//   - score = 0.6 × (itemCount / maxItems) + 0.4 × recencyScore
//   - recencyScore = 최근 5년 출제 비율 (0~1)
//   - 그레이드: ≥0.75=S, ≥0.55=A, ≥0.30=B, 그 외=C

// ── 6. cutScores — 공개된 1차 합격선 ───────────────────────────────────────

// 사용자가 등록한 지역의 학년도별 1차 합격선 추이.
// 헌법 제3조의2 4항 정합 — 공개된 사실 데이터만 표시, 점수 예측·합격 가능성 X.
export const getCutScoresByRegion = cache(
  async (region: string): Promise<CutScoreRow[]> => {
    return safeRun(
      `exam-analysis getCutScoresByRegion(${region})`,
      async () => {
        const db = getDb();
        const rows = await db
          .select()
          .from(cutScores)
          .where(eq(cutScores.region, region))
          .orderBy(desc(cutScores.year));
        return rows.map((r) => ({
          region: r.region,
          year: r.year,
          appliedCount: r.appliedCount,
          applicantCount: r.applicantCount,
          competitionRatio: r.competitionRatio == null ? null : Number(r.competitionRatio),
          firstRoundCutScore:
            r.firstRoundCutScore == null ? null : Number(r.firstRoundCutScore),
          verified: r.verified,
          sourceNote: r.sourceNote,
        }));
      },
      [] as CutScoreRow[],
    );
  },
);

// ── 7. roadmap — roadmap 탭 ───────────────────────────────────────────────
//
// 등급 산식 (헌법 제3조의2 정합 — 합격 컷·확률 추정 X):
//   - score = 0.6 × (itemCount / maxItems) + 0.4 × recencyScore
//   - recencyScore = 최근 5년 출제 비율 (0~1)
//   - 그레이드: ≥0.75=S, ≥0.55=A, ≥0.30=B, 그 외=C

export const getRoadmap = cache(async (): Promise<RoadmapEntry[]> => {
  return safeRun(
    "exam-analysis getRoadmap",
    async () => {
      const db = getDb();
      const rows = await db.execute<{
        domain: string;
        item_count: number;
        years_covered: number;
        recent_count: number;
      }>(sql`
        with current_year as (
          select max(year)::int as y from exam_papers
        )
        select
          d.value as domain,
          count(*)::int as item_count,
          count(distinct ep.year)::int as years_covered,
          count(*) filter (where ep.year >= (select y from current_year) - 4)::int as recent_count
        from exam_items ei
        join exam_papers ep on ep.id = ei.paper_id
        cross join lateral jsonb_array_elements_text(ei.domains) as d(value)
        where length(trim(d.value)) > 0
        group by d.value
      `);

      if (rows.length === 0) return [] as RoadmapEntry[];

      const maxItems = Math.max(...rows.map((r) => r.item_count));
      const totalRecent = rows.reduce((s, r) => s + r.recent_count, 0);

      const ranked = rows.map((r) => {
        const recencyScore = totalRecent > 0 ? r.recent_count / totalRecent : 0;
        const score = 0.6 * (r.item_count / maxItems) + 0.4 * recencyScore;
        const grade: RoadmapEntry["grade"] =
          score >= 0.75 ? "S" : score >= 0.55 ? "A" : score >= 0.3 ? "B" : "C";
        const reason =
          grade === "S"
            ? `누적 ${r.item_count}문항 · 최근 5년 ${r.recent_count}문항 — 최우선 회독`
            : grade === "A"
              ? `누적 ${r.item_count}문항 · 최근 5년 ${r.recent_count}문항 — 주 2회 회독`
              : grade === "B"
                ? `누적 ${r.item_count}문항 — 주 1회 회독`
                : `누적 ${r.item_count}문항 — 시간 여유 시 회독`;
        return {
          domain: r.domain,
          itemCount: r.item_count,
          yearsCovered: r.years_covered,
          recencyScore,
          grade,
          reason,
        };
      });

      ranked.sort((a, b) => {
        const ord: Record<RoadmapEntry["grade"], number> = { S: 0, A: 1, B: 2, C: 3 };
        if (ord[a.grade] !== ord[b.grade]) return ord[a.grade] - ord[b.grade];
        return b.itemCount - a.itemCount;
      });

      return ranked;
    },
    [] as RoadmapEntry[],
  );
});
