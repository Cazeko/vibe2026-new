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
  // 사용자 보고 2026-05-12 — GitHub style 52주 × 7일 1년 표시.
  // 좁은 컨테이너 시 부모에서 overflow-x-auto 로 가로 스크롤 처리.
  const weekCount = Math.ceil(cells.length / 7);
  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < weekCount; i += 1) {
    weeks.push(cells.slice(i * 7, i * 7 + 7));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-[2px] min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((c, di) => {
              const lv = level(c.minutes);
              return (
                <span
                  key={`${wi}-${di}`}
                  title={`${c.date} · ${c.minutes}분`}
                  className={`h-[11px] w-[11px] rounded-[2px] ${TONE_BG[lv]}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      {/* H2 헌법 v3.5.1 — 범례에 단위 명시 (0 / 15분 미만 / 45분 미만 / 90분 미만 / 90분 이상) */}
      <div className="flex items-center gap-1.5 text-[9.5px] text-muted-foreground flex-wrap">
        <span>적음</span>
        {TONE_BG.map((t, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-sm ${t}`}
            title={LEVEL_LABEL[i]}
            aria-label={LEVEL_LABEL[i]}
          />
        ))}
        <span>많음</span>
        <span className="ml-2 text-muted-foreground/80">
          (1칸 = 15분 단위)
        </span>
      </div>
    </div>
  );
}

const LEVEL_LABEL = [
  "학습 없음",
  "15분 미만",
  "15~45분",
  "45~90분",
  "90분 이상",
];
