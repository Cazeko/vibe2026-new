// 헌법 v3.5 제13조의2·DESIGN.md §4.4 정합 — 영역×학년도 / Bloom×학년도 / 형식×학년도 히트맵.
// 단일 색의 명도 단계로만 표현 (다색 충돌 회피). evergreen 은 §4.3 5번 액센트 보호를 위해
// 사용하지 아니하고 desaturated info(navy) 1색의 alpha 단계로 표현한다.
//
// 사용자 보고 2026-05-12 반영:
// - 모든 v > 0 셀에 카운트 숫자 노출 (임계값 제거 — 가독성 우선)
// - 색단계 alpha 0.18~0.85 → 0.12~1.0 으로 확장하여 적음~많음 구분 직관화
// - 행 라벨 sticky-left + 합계 컬럼 sticky-right (가로 스크롤 중에도 컨텍스트 유지)
// - 가로 스크롤 hint 안내 (모바일/태블릿 가시성)

import type { HeatmapMatrix } from "@/lib/exam-analysis/queries";

type ToneKey = "info" | "warning";

const TONE_CLASS: Record<ToneKey, { color: string; faintBg: string }> = {
  info: {
    color: "var(--color-info)",
    faintBg: "hsl(var(--color-rule) / 0.45)",
  },
  warning: {
    color: "var(--color-warning)",
    faintBg: "hsl(var(--color-rule) / 0.45)",
  },
};

const CELL = 26; // px — 1셀 정사각형 크기 (셀 안에 1~2자리 숫자 가독)

export function ExamHeatmap({
  matrix,
  tone = "info",
  yearLabelMode = "short",
}: {
  matrix: HeatmapMatrix;
  tone?: ToneKey;
  yearLabelMode?: "short" | "full";
}) {
  const { rows, years, cells, rowTotals, max } = matrix;

  if (rows.length === 0 || years.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-rule bg-background/40 px-4 py-8 text-center text-[12px] text-muted-foreground">
        시드 적재 후 표시됩니다.
      </div>
    );
  }

  const palette = TONE_CLASS[tone];

  return (
    <div className="space-y-2">
      {/* C-11 (외부 리뷰 2026-05-12) — 범례를 표 상단으로 이동. 셀의 색이
          무엇을 의미하는지 표를 보기 전에 알 수 있도록 시선 흐름 정합. */}
      <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <span>적음</span>
          {[0.12, 0.3, 0.5, 0.7, 0.9].map((alpha) => (
            <span
              key={alpha}
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{ backgroundColor: `hsl(${palette.color} / ${alpha})` }}
            />
          ))}
          <span>많음</span>
          <span className="ml-2 tabular-nums">최대 {max}문항/셀</span>
        </div>
        <span className="tabular-nums">← 좌우 스크롤 →</span>
      </div>
      {/* 사용자 보고 2026-05-12 — 표가 좌측에 기울어져서 시각적 균형 깨짐.
          inner-flex 로 중앙 정렬. 표 폭이 컨테이너보다 크면 자연스럽게 가로
          스크롤 (overflow-x-auto)로 fallback. */}
      <div className="relative overflow-x-auto flex justify-center">
        <table
          className="text-[10.5px] border-separate mx-auto"
          style={{ borderSpacing: "2px" }}
        >
          <thead>
            <tr>
              {/* 좌상단 코너 — 시각 레이아웃 전용 (행 헤더 <th scope="row"> 가
                  실제 행 의미를 담당). 스크린리더는 빈 셀로 인식하도록 td 사용. */}
              <td
                aria-hidden
                className="sticky left-0 z-10 bg-card pr-2"
                style={{ width: 120, minWidth: 120 }}
              />
              {years.map((y) => (
                <th
                  key={y}
                  scope="col"
                  title={`${y}학년도`}
                  className="px-0 text-center font-normal text-muted-foreground tabular-nums"
                  style={{ width: CELL, minWidth: CELL }}
                >
                  {yearLabelMode === "short" ? String(y).slice(-2) : String(y)}
                </th>
              ))}
              <th
                scope="col"
                className="sticky right-0 z-10 bg-card pl-3 text-right font-normal text-muted-foreground tabular-nums whitespace-nowrap"
              >
                합계
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-card pr-2 text-right font-normal text-foreground/85 whitespace-nowrap"
                >
                  {row}
                </th>
                {years.map((y, yi) => {
                  const v = cells[ri][yi];
                  const intensity = max > 0 ? v / max : 0;
                  const filled = v > 0;
                  // 색단계 확장 — alpha 0.12 (배경 대비 약한 표시) → 1.0 (최대)
                  const bg = filled
                    ? `hsl(${palette.color} / ${0.12 + intensity * 0.88})`
                    : palette.faintBg;
                  // P0-09 (외부 평가 2026-05-12) — 진한 셀 위 텍스트 자동 반전.
                  // 종전 0.6 임계 + cream 톤은 0.45~0.60 구간에서 대비가 모자라
                  // 가독성 저하. 임계 0.45 로 낮추고 순수 흰색으로 명확화.
                  // WCAG AA 4.5:1 정합 — info(navy)·warning(mustard) 모두 alpha
                  // 0.45 부터 흰색이 본문보다 가독성 우위.
                  const numColor =
                    intensity >= 0.45
                      ? "#FFFFFF"
                      : "hsl(var(--color-text) / 0.88)";
                  return (
                    <td
                      key={y}
                      className="p-0"
                      style={{ width: CELL, minWidth: CELL }}
                    >
                      <div
                        title={`${row} · ${y}학년도 · ${v}문항`}
                        aria-label={`${row} · ${y}학년도 · ${v}문항`}
                        className="relative h-[24px] w-[24px] rounded-[3px] mx-auto flex items-center justify-center tabular-nums leading-none transition-transform hover:scale-110 hover:z-20 hover:shadow-md"
                        style={{
                          backgroundColor: bg,
                          fontSize: "9.5px",
                          color: numColor,
                          fontWeight: filled ? 600 : 400,
                        }}
                      >
                        {filled ? v : ""}
                      </div>
                    </td>
                  );
                })}
                <td className="sticky right-0 z-10 bg-card pl-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                  {rowTotals[ri]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* C-11 — 범례는 상단으로 이동했으므로 하단 중복 제거. */}
    </div>
  );
}
