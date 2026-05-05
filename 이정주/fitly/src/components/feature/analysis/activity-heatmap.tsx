// 헌법 v1.10 — GitHub-style 활동 히트맵. 서버 컴포넌트, 데이터는 props.

export type HeatmapCell = {
  date: string;        // YYYY-MM-DD
  minutes: number;
};

// 헌법 v2.1 — 액센트 단일 사용. 활동 강도는 evergreen 명도 단계로 표현.
const TONE_BG = [
  "bg-rule",
  "bg-evergreen/20",
  "bg-evergreen/40",
  "bg-evergreen/70",
  "bg-evergreen",
];

function level(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 45) return 2;
  if (minutes < 90) return 3;
  return 4;
}

export function ActivityHeatmap({ cells }: { cells: HeatmapCell[] }) {
  // 12 weeks × 7 days
  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < 12; i += 1) {
    weeks.push(cells.slice(i * 7, i * 7 + 7));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((c, di) => {
              const lv = level(c.minutes);
              return (
                <span
                  key={`${wi}-${di}`}
                  title={`${c.date} · ${c.minutes}분`}
                  className={`h-2.5 w-2.5 rounded-sm ${TONE_BG[lv]}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[9.5px] text-muted-foreground">
        <span>적음</span>
        {TONE_BG.map((t, i) => (
          <span key={i} className={`h-2 w-2 rounded-sm ${t}`} />
        ))}
        <span>많음</span>
      </div>
    </div>
  );
}
