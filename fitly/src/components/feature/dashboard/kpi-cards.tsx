import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardKpi } from "@/lib/dashboard/types";

function formatHourMin(min: number): string {
  if (!min || min < 1) return "0분";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}분`;
  if (!m) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

// 헌법 v2.1 제16조의2 — 액센트(evergreen)는 *학습 진척도 KPI 와 진척 바 에만* 사용한다.
// 나머지 3개 KPI 는 단색 + 세리프 큰 숫자 (DESIGN.md §3 헤드라인 패턴).
type Card = {
  label: string;
  value: string;
  sub: string;
  Icon: typeof Target;
  isProgress?: boolean;
  progressPct?: number;
};

export function KpiCards({ kpi }: { kpi: DashboardKpi }) {
  const cards: Card[] = [
    {
      label: "지역 교육청",
      value: kpi.targetRegionShort ?? "미설정",
      sub:
        kpi.daysToExam != null
          ? `D-${kpi.daysToExam}`
          : "설정에서 시험일 등록",
      Icon: Target,
    },
    {
      label: "학습 진척도",
      value: `${kpi.progressScore}`,
      sub: `본인 누적 · 풀이 ${kpi.progressBreakdown.quizMasteryRate}/키워드 ${kpi.progressBreakdown.keywordMasteryRate}/일관 ${kpi.progressBreakdown.studyConsistency}`,
      Icon: TrendingUp,
      isProgress: true,
      progressPct: kpi.progressScore,
    },
    {
      label: "최근 7일 학습",
      value: formatHourMin(kpi.studyMinutes),
      sub:
        kpi.studyDeltaMinutes > 0
          ? `지난 주보다 +${formatHourMin(kpi.studyDeltaMinutes)}`
          : "이번 주 첫 학습 시작 권장",
      Icon: Clock,
    },
    {
      label: "연속 학습",
      value: `${kpi.streakDays}일`,
      sub: kpi.streakBest > 0 ? `최장 ${kpi.streakBest}일` : "오늘부터 첫 기록",
      Icon: Flame,
    },
  ];

  return (
    <section
      aria-label="핵심 지표"
      className="grid grid-cols-2 xl:grid-cols-4 gap-3"
    >
      {cards.map(({ label, value, sub, Icon, isProgress, progressPct }) => (
        <Card key={label} className="border-rule">
          <CardContent className="p-5 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p
                  className={cn(
                    "mt-2 font-serif font-medium leading-none tracking-tight num truncate",
                    isProgress
                      ? "text-evergreen text-3xl"
                      : "text-foreground text-2xl"
                  )}
                >
                  {value}
                  {isProgress && (
                    <span className="ml-1 text-sm font-sans text-muted-foreground font-normal">
                      /100
                    </span>
                  )}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground truncate">
                  {sub}
                </p>
              </div>
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground"
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            {isProgress && progressPct != null && (
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-rule">
                <span
                  className="block h-full bg-evergreen rounded-full gauge-fill"
                  style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
