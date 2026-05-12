// 헌법 v1.10 — GitHub-style 활동 히트맵. 서버 컴포넌트, 데이터는 props.

export type HeatmapCell = {
  date: string;        // YYYY-MM-DD
  minutes: number;
};

// 헌법 v2.1 — 액센트 단일 사용. 활동 강도는 evergreen 명도 단계로 표현.
// P1-02 (외부 리뷰 2026-05-12) — 종전 /20·/40 단계가 시각 차이 부족.
// 단계간 alpha 차를 균등화 (≈20%씩) 하여 적음→많음 구분 직관화.
// P1 코드 리뷰 H2 fix — 다크모드 accent(L 38%) 가 라이트(L 21%) 대비 밝아
// /15 alpha 가 어두운 배경 위에 거의 보이지 않고 /35 와 합쳐짐. 다크 전용
// 단계를 별도 정의(/25·/50·/75·/100) 하여 시각 단계 보존.
const TONE_BG = [
  "bg-rule",
  "bg-evergreen/15 dark:bg-evergreen/25",
  "bg-evergreen/35 dark:bg-evergreen/50",
  "bg-evergreen/65 dark:bg-evergreen/75",
  "bg-evergreen",
];

function level(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 45) return 2;
  if (minutes < 90) return 3;
  return 4;
}

function monthOf(cell: HeatmapCell | undefined): number {
  if (!cell) return -1;
  const m = new Date(cell.date).getMonth();
  return Number.isNaN(m) ? -1 : m;
}

export function ActivityHeatmap({ cells }: { cells: HeatmapCell[] }) {
  // 사용자 보고 2026-05-12 — GitHub style 52주 × 7일 1년 표시.
  // 좁은 컨테이너 시 부모에서 overflow-x-auto 로 가로 스크롤 처리.
  const weekCount = Math.ceil(cells.length / 7);
  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < weekCount; i += 1) {
    weeks.push(cells.slice(i * 7, i * 7 + 7));
  }

  // P1-02 (외부 리뷰 2026-05-12) — X축 월 라벨. 각 주의 첫 일자 month 가
  // 이전 주와 다르면 라벨 노출. 첫 주는 무조건 노출.
  // P1 코드 리뷰 H3 fix — 라벨 텍스트(~28px)가 셀 폭(11px+gap)을 초과하므로
  // 직전 라벨로부터 최소 2주(≈26px) 간격 강제. 인접 월 라벨 겹침 방지.
  // P1 코드 리뷰 M4 fix — weeks[wi-1][0] undefined 가드 (optional chaining).
  const monthLabels: (number | null)[] = [];
  let lastLabelIdx = -Infinity;
  for (let wi = 0; wi < weeks.length; wi += 1) {
    const curr = monthOf(weeks[wi]?.[0]);
    if (curr < 0) {
      monthLabels.push(null);
      continue;
    }
    const isFirst = monthLabels.length === 0;
    const prev = wi > 0 ? monthOf(weeks[wi - 1]?.[0]) : -1;
    const changed = curr !== prev;
    if ((isFirst || changed) && wi - lastLabelIdx >= 2) {
      monthLabels.push(curr + 1);
      lastLabelIdx = wi;
    } else {
      monthLabels.push(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative pt-4">
        <div className="flex items-end gap-[2px] min-w-max">
          {weeks.map((week, wi) => {
            const labelMonth = monthLabels[wi];
            return (
              <div key={wi} className="flex flex-col gap-[2px] relative">
                {labelMonth !== null && (
                  <span
                    aria-hidden
                    className="absolute -top-4 left-0 text-[9px] text-muted-foreground tabular-nums whitespace-nowrap"
                  >
                    {labelMonth}월
                  </span>
                )}
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
            );
          })}
        </div>
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
