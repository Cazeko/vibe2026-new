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

type Kind = "goal" | "progress" | "minutes" | "streak";
type Card = {
  kind: Kind;
  label: string;
  value: string;
  unit?: string;
  denom?: string;
  sub: React.ReactNode;
  Icon: typeof Target;
  progressPct?: number;
};

export function KpiCards({ kpi }: { kpi: DashboardKpi }) {
  const goalSub =
    kpi.daysToExam != null
      ? `D−${kpi.daysToExam} · 2026학년도 1차`
      : "설정에서 시험일·지역 등록";
  // 헌법 제3조의2 정합 — studyDeltaMinutes === 0 시 친화 폴백 (C3)
  const minutesSub =
    kpi.studyDeltaMinutes > 0 ? (
      <>
        지난 주보다{" "}
        <span className="font-semibold text-evergreen">
          +{formatHourMin(kpi.studyDeltaMinutes)}
        </span>
      </>
    ) : kpi.studyMinutes > 0 ? (
      <>이번 주 첫 학습 시작 권장</>
    ) : (
      <>아직 학습 기록 없음</>
    );

  const cards: Card[] = [
    {
      kind: "goal",
      label: "목표",
      value: kpi.targetRegionShort ?? "미설정",
      sub: goalSub,
      Icon: Target,
    },
    {
      kind: "progress",
      label: "학습 진척도",
      value: `${kpi.progressScore}`,
      denom: "/100",
      sub: `본인 누적 · 풀이 ${kpi.progressBreakdown.quizMasteryRate} / 키워드 ${kpi.progressBreakdown.keywordMasteryRate} / 일관 ${kpi.progressBreakdown.studyConsistency}`,
      Icon: TrendingUp,
      progressPct: kpi.progressScore,
    },
    {
      kind: "minutes",
      label: "최근 7일 학습",
      value: `${kpi.studyMinutes >= 60 ? Math.floor(kpi.studyMinutes / 60) : kpi.studyMinutes}`,
      unit: kpi.studyMinutes >= 60 ? "시간" : "분",
      sub: minutesSub,
      Icon: Clock,
    },
    {
      kind: "streak",
      label: "연속 학습",
      value: `${kpi.streakDays}`,
      unit: "일",
      sub: kpi.streakBest > 0 ? `최장 ${kpi.streakBest}일 · 오늘도 이어가요` : "오늘부터 첫 기록",
      Icon: Flame,
    },
  ];

  return (
    // 헌법 제24조의2 정합 — A1 lg 잘림 fix: md:3 lg:4 단계화 + gap-3 + min-w-0
    <section
      aria-label="요약 지표"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
    >
      {cards.map(({ kind, label, value, unit, denom, sub, Icon, progressPct }) => {
        const isGoal = kind === "goal";
        return (
          <article
            key={label}
            tabIndex={0}
            className={cn(
              // G2 — focus-visible ring (evergreen은 진척도/CTA/AI 추천에만, 일반은 rule-strong)
              "rounded-card border min-h-[132px] px-[22px] py-5 flex flex-col transition-colors overflow-hidden min-w-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isGoal
                ? "bg-evergreen border-evergreen text-cream focus-visible:ring-evergreen/40"
                : "bg-cream-soft border-rule hover:border-rule-strong focus-visible:ring-rule-strong/60"
            )}
          >
            <div className="flex items-center justify-between mb-3.5">
              <p
                className={cn(
                  "text-[11.5px] font-bold uppercase tracking-[0.18em]",
                  isGoal ? "text-gold" : "text-muted-foreground"
                )}
              >
                {label}
              </p>
              <span
                aria-hidden
                className={cn(
                  "grid h-[30px] w-[30px] place-items-center rounded-[7px]",
                  isGoal
                    ? "bg-white/[0.07] text-gold"
                    : "bg-cream-deep text-evergreen"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p
              className={cn(
                "font-bold leading-[1.05] tracking-[-0.03em] num flex items-baseline gap-1.5",
                isGoal ? "text-[28px] text-cream" : "text-[34px] text-foreground"
              )}
            >
              <span className="truncate">{value}</span>
              {denom && (
                <span className="text-[17px] font-medium text-muted-foreground tracking-[-0.01em]">
                  {denom}
                </span>
              )}
              {unit && (
                <span
                  className={cn(
                    "text-sm font-medium tracking-normal",
                    isGoal ? "text-cream/70" : "text-muted-foreground"
                  )}
                >
                  {unit}
                </span>
              )}
            </p>
            {/* A2 — progressBreakdown 등 긴 서브텍스트 line-clamp-2 + max-w-full */}
            <p
              className={cn(
                "mt-2 text-[12px] leading-[1.5] line-clamp-2 max-w-full",
                isGoal ? "text-cream/75" : "text-muted-foreground"
              )}
            >
              {sub}
            </p>
            {kind === "progress" && progressPct != null && (
              <div className="mt-auto pt-3 h-1 overflow-hidden rounded-full bg-cream-deep">
                <span
                  className="block h-full bg-evergreen rounded-full gauge-fill"
                  style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
                />
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
