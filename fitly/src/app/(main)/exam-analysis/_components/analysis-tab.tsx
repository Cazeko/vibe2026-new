import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  getDomainHeatmap,
  getBloomHeatmap,
  getFormatHeatmap,
  type HeatmapMatrix,
} from "@/lib/exam-analysis/queries";
import { ExamHeatmap } from "./exam-heatmap";
import { EmptySeedNotice } from "./empty-seed-notice";

// 헌법 v3.5 제13조의2 정합 — 영역×학년도 / Bloom×학년도 / 형식×학년도 히트맵 3종.
// 단일 색(info navy) 명도 단계로만 표현 — DESIGN.md §4.3 evergreen 보호 + §4.4 차분한 채도.
//
// 사용자 보고 2026-05-12 반영:
// - 최근 5년 출제 0회 행(객관식·교육학·적용 등)을 기본 숨김 (헌법 제3조의2 정직성)
// - 토글 버튼으로 "미사용 영역 표시 ↔ 숨기기" 전환 (URL ?showAll=1)
// - 모든 셀(v > 0)에 카운트 숫자 노출 (임계값 제거, 가독성 ↑)

const RECENT_YEARS_WINDOW = 5;

export async function AnalysisTab({ showAll = false }: { showAll?: boolean }) {
  const [domain, bloom, format] = await Promise.all([
    getDomainHeatmap(),
    getBloomHeatmap(),
    getFormatHeatmap(),
  ]);

  const allEmpty =
    domain.rows.length === 0 &&
    bloom.rows.length === 0 &&
    format.rows.length === 0;

  if (allEmpty) {
    return (
      <EmptySeedNotice tabHint="영역×학년도 / 인지수준×학년도 / 문항형식×학년도 히트맵 3종" />
    );
  }

  // 토글 OFF (기본): 최근 5년 출제 0회 행을 자동 제외
  // 토글 ON (?showAll=1): 모든 행 노출
  const domainView = showAll ? domain : filterInactiveRows(domain);
  const bloomView = showAll ? bloom : filterInactiveRows(bloom);
  const formatView = showAll ? format : filterInactiveRows(format);

  const hiddenCount =
    domain.rows.length -
    domainView.rows.length +
    (bloom.rows.length - bloomView.rows.length) +
    (format.rows.length - formatView.rows.length);

  return (
    <div className="space-y-5">
      {/* 토글 + 안내 */}
      <FilterToggle showAll={showAll} hiddenCount={hiddenCount} />

      <HeatmapSection
        title="영역 × 학년도"
        subtitle="11과목 + 교육학 — 학년도별 출제 빈도"
        meta={`${domainView.rows.length}행`}
        matrix={domainView}
        tone="info"
      />
      <HeatmapSection
        title="인지수준 × 학년도"
        subtitle="기억·이해·적용·분석·평가·창작 — 6단계 사고 수준"
        meta={`${bloomView.rows.length}행`}
        matrix={bloomView}
        tone="info"
      />
      <HeatmapSection
        title="문항형식 × 학년도"
        subtitle="객관식·단답형·서술형·논술형"
        meta={`${formatView.rows.length}행`}
        matrix={formatView}
        tone="warning"
      />
    </div>
  );
}

function FilterToggle({
  showAll,
  hiddenCount,
}: {
  showAll: boolean;
  hiddenCount: number;
}) {
  // 토글은 URL searchParam 으로 작동 — 서버 렌더 + 새로고침/공유 안전.
  const targetHref = showAll
    ? "/exam-analysis?tab=analysis"
    : "/exam-analysis?tab=analysis&showAll=1";
  const Icon = showAll ? EyeOff : Eye;
  const label = showAll ? "최근 5년 활성 영역만 보기" : "미사용 영역 함께 보기";

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap rounded-md border border-rule bg-secondary/20 px-4 py-2.5">
      <p className="text-[11.5px] text-muted-foreground leading-relaxed">
        {showAll ? (
          <>
            <strong className="text-foreground/85">미사용 영역 포함</strong> —
            최근 {RECENT_YEARS_WINDOW}년간 출제되지 않은 분류(객관식·교육학 등)도
            함께 표시 중.
          </>
        ) : (
          <>
            <strong className="text-foreground/85">활성 영역만 표시</strong> —
            최근 {RECENT_YEARS_WINDOW}년간 출제 0회 분류 자동 제외 (헌법 제3조의2
            정직성 정합).
            {hiddenCount > 0 && (
              <>
                {" "}
                <span className="tabular-nums">{hiddenCount}개 행 숨김</span>.
              </>
            )}
          </>
        )}
      </p>
      <Link
        href={targetHref}
        prefetch={false}
        className="inline-flex items-center gap-1.5 rounded-md border border-rule-strong bg-card px-3 py-1.5 text-[11.5px] font-medium text-foreground hover:bg-secondary transition-colors shrink-0"
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </Link>
    </div>
  );
}

function HeatmapSection({
  title,
  subtitle,
  meta,
  matrix,
  tone,
}: {
  title: string;
  subtitle: string;
  meta: string;
  matrix: HeatmapMatrix;
  tone: "info" | "warning";
}) {
  return (
    <Card className="border-rule">
      <CardContent className="p-5">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-serif text-lg font-medium tracking-tight">
              {title}
            </h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
            {meta}
          </div>
        </div>
        <div className="mt-4">
          <ExamHeatmap matrix={matrix} tone={tone} />
        </div>
      </CardContent>
    </Card>
  );
}

// 최근 N년간 출제 0회 행을 자동 제외. yearTotals · max 도 함께 재계산하여
// 색 단계 정규화가 살아있는 분류 기준으로 작동하도록 한다.
function filterInactiveRows(
  matrix: HeatmapMatrix,
  recentYears: number = RECENT_YEARS_WINDOW,
): HeatmapMatrix {
  if (matrix.rows.length === 0 || matrix.years.length === 0) return matrix;

  const yearsCount = matrix.years.length;
  const recentStartIdx = Math.max(0, yearsCount - recentYears);

  const keepIndices: number[] = [];
  for (let ri = 0; ri < matrix.rows.length; ri++) {
    let recentSum = 0;
    for (let yi = recentStartIdx; yi < yearsCount; yi++) {
      recentSum += matrix.cells[ri][yi];
    }
    if (recentSum > 0) keepIndices.push(ri);
  }

  // 안전장치 — 모두 필터되면 원본 반환 (빈 매트릭스 차단)
  if (keepIndices.length === 0) return matrix;

  const rows = keepIndices.map((ri) => matrix.rows[ri]);
  const cells = keepIndices.map((ri) => matrix.cells[ri]);
  const rowTotals = keepIndices.map((ri) => matrix.rowTotals[ri]);
  const yearTotals = matrix.years.map((_, yi) =>
    cells.reduce((s, row) => s + row[yi], 0),
  );
  const allValues = cells.flat();
  const max = allValues.length > 0 ? Math.max(0, ...allValues) : 0;

  return { rows, years: matrix.years, cells, rowTotals, yearTotals, max };
}
