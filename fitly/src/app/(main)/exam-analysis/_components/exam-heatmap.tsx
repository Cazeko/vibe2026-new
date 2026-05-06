// 헌법 v3.5 제13조의2·DESIGN.md §4.4 정합 — 영역×학년도 / Bloom×학년도 / 형식×학년도 히트맵.
// 단일 색의 명도 단계로만 표현 (다색 충돌 회피). evergreen 은 §4.3 5번 액센트 보호를 위해
// 사용하지 아니하고 desaturated info(navy) 1색의 alpha 단계로 표현한다.

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
    <div className="overflow-x-auto">
      <table
        className="text-[10.5px] border-separate"
        style={{ borderSpacing: "2px" }}
      >
        <thead>
          <tr>
            <th aria-label="row label" className="w-[120px]" />
            {years.map((y) => (
              <th
                key={y}
                className="px-0 text-center font-normal text-muted-foreground tabular-nums"
                style={{ width: 22, minWidth: 22 }}
              >
                {yearLabelMode === "short"
                  ? String(y).slice(-2)
                  : String(y)}
              </th>
            ))}
            <th className="pl-3 text-right font-normal text-muted-foreground tabular-nums">
              합계
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row}>
              <th
                className="pr-2 text-right font-normal text-foreground/80 whitespace-nowrap"
                scope="row"
              >
                {row}
              </th>
              {years.map((y, yi) => {
                const v = cells[ri][yi];
                const intensity = max > 0 ? v / max : 0;
                const filled = v > 0;
                const bg = filled
                  ? `hsl(${palette.color} / ${0.18 + intensity * 0.62})`
                  : palette.faintBg;
                return (
                  <td
                    key={y}
                    className="p-0"
                    style={{ width: 22, minWidth: 22 }}
                  >
                    <div
                      title={`${row} · ${y} · ${v}문항`}
                      className="h-[20px] w-[20px] rounded-[3px] mx-auto"
                      style={{ backgroundColor: bg }}
                      aria-label={`${row} · ${y}학년도 · ${v}문항`}
                    />
                  </td>
                );
              })}
              <td className="pl-3 text-right tabular-nums text-muted-foreground">
                {rowTotals[ri]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 범례 */}
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>적음</span>
        {[0.18, 0.32, 0.5, 0.7, 0.85].map((alpha) => (
          <span
            key={alpha}
            className="h-2.5 w-2.5 rounded-[2px]"
            style={{ backgroundColor: `hsl(${palette.color} / ${alpha})` }}
          />
        ))}
        <span>많음</span>
        <span className="ml-2 tabular-nums">최대 {max}문항/셀</span>
      </div>
    </div>
  );
}
