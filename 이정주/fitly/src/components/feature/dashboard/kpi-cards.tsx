import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, Clock, Flame } from "lucide-react";
import type { DashboardKpi } from "@/lib/dashboard/types";

function formatHourMin(min: number): string {
  if (!min || min < 1) return "0분";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}분`;
  if (!m) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

// 헌법 v2.0 — KPI 4 카드는 실데이터(getDashboardSummary)에서 props로 받는다.
// "Fit 점수" 폐지 → "학습 진척도(Progress)" 로 재명명.
export function KpiCards({ kpi }: { kpi: DashboardKpi }) {
  const cards = [
    {
      label: "목표 학교",
      value: kpi.targetUniversityShort ?? "미설정",
      sub:
        kpi.daysToExam != null
          ? `D-${kpi.daysToExam}`
          : "설정에서 학교·시험일 등록",
      Icon: Target,
      tone: "text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/15",
    },
    {
      label: "학습 진척도",
      value: `${kpi.progressScore}`,
      sub: `본인 누적 · 어휘 ${kpi.progressBreakdown.vocabMasteryRate}/오답 ${kpi.progressBreakdown.mistakeConquerRate}/일관 ${kpi.progressBreakdown.studyConsistency}`,
      Icon: TrendingUp,
      tone: "text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/15",
    },
    {
      label: "최근 7일 학습",
      value: formatHourMin(kpi.studyMinutes),
      sub:
        kpi.studyDeltaMinutes > 0
          ? `지난 주보다 +${formatHourMin(kpi.studyDeltaMinutes)}`
          : "이번 주 첫 학습 시작 권장",
      Icon: Clock,
      tone: "text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/15",
    },
    {
      label: "연속 학습",
      value: `${kpi.streakDays}일`,
      sub: kpi.streakBest > 0 ? `최장 ${kpi.streakBest}일` : "오늘부터 첫 기록",
      Icon: Flame,
      tone: "text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-500/15",
    },
  ];

  return (
    <section
      aria-label="핵심 지표"
      className="grid grid-cols-2 xl:grid-cols-4 gap-3"
    >
      {cards.map(({ label, value, sub, Icon, tone }) => (
        <Card
          key={label}
          className="rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <CardContent className="p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight truncate">
                {value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground truncate">
                {sub}
              </p>
            </div>
            <span
              aria-hidden
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}
            >
              <Icon className="h-4 w-4" />
            </span>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
