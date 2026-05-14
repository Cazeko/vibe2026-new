import { Target, TrendingUp, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardKpi } from "@/lib/dashboard/types";
import { StreakFreezeAction } from "./streak-freeze-action";

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
  // v3.6 외부 평가 #2.2 — D-Day 폰트 강조 (심리적 압박감 = 동기부여).
  // sub 영역의 D-XX 부분만 별도 노드로 분리하여 굵게 + 큰 폰트 사이즈.
  const goalSub: React.ReactNode =
    kpi.daysToExam != null ? (
      <span className="inline-flex items-baseline gap-1.5">
        <span className="font-extrabold text-[15px] tabular-nums tracking-[-0.02em] text-gold">
          D−{kpi.daysToExam}
        </span>
        <span className="text-cream/70">· 2026학년도 1차</span>
      </span>
    ) : (
      "설정에서 시험일·지역 등록"
    );
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
      // 헌법 v3.5.1 제16조 — 잔디 얼리기 sub inject. canFreezeToday 일 때만 노출.
      sub: kpi.canFreezeToday ? (
        <StreakFreezeAction available={kpi.streakFreezesAvailable} />
      ) : kpi.streakBest > 0 ? (
        `최장 ${kpi.streakBest}일 · 오늘도 이어가요`
      ) : (
        "오늘부터 첫 기록"
      ),
      Icon: Flame,
    },
  ];

  return (
    // 헌법 제24조의2 정합 — A1 lg 잘림 fix: md:3 lg:4 단계화 + gap-3 + min-w-0
    // viewport fit (lg+): shrink-0 으로 자기 높이 유지, padding·min-h 축소
    <section
      aria-label="요약 지표"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:shrink-0"
    >
      {cards.map(({ kind, label, value, unit, denom, sub, Icon, progressPct }) => {
        const isGoal = kind === "goal";
        return (
          <article
            key={label}
            tabIndex={0}
            className={cn(
              // G2 — focus-visible ring (evergreen은 진척도/CTA/AI 추천에만, 일반은 rule-strong)
              // viewport fit — lg+ 컴팩트 padding (px-22→px-4, py-5→py-3)
              // D-19 (외부 리뷰 2026-05-12) — 카드 hover 어포던스. §7 모션 절제 정합으로
              // Y-이동 없이 보더+shadow 만 변화. 리뷰 M5 fix — transition-all 즉각성
              // 저하 회피, colors/shadow/border 만 transition (150ms).
              // v3.6 외부 평가 #2.6 — 카드 hover translateY (-2px) 재도입.
              // 사용자 명시 발화 §38 7항 우선 — v3.5.4 M5 fix 의 절제 결정 위에
              // 외부 평가의 어포던스 요구를 적용. translate + 색·shadow 동시 transition.
              "rounded-card border min-h-[132px] lg:min-h-[110px] px-[22px] py-5 lg:px-4 lg:py-3 flex flex-col [transition:transform_150ms_ease,border-color_150ms_ease,box-shadow_150ms_ease,background-color_150ms_ease] hover:-translate-y-0.5 overflow-hidden min-w-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isGoal
                ? "bg-evergreen border-evergreen text-cream focus-visible:ring-evergreen/40 hover:bg-evergreen-strong"
                : "bg-cream-soft border-rule hover:border-rule-strong hover:shadow-sm dark:hover:bg-cream-soft/80 focus-visible:ring-rule-strong/60"
            )}
          >
            <div className="flex items-center justify-between mb-3.5 lg:mb-2">
              <p
                className={cn(
                  "text-[11.5px] lg:text-[10.5px] font-bold uppercase tracking-[0.18em]",
                  isGoal ? "text-gold" : "text-muted-foreground"
                )}
              >
                {label}
              </p>
              <span
                aria-hidden
                className={cn(
                  "grid h-[30px] w-[30px] lg:h-[26px] lg:w-[26px] place-items-center rounded-[7px]",
                  isGoal
                    ? "bg-white/[0.07] text-gold"
                    : "bg-cream-deep text-evergreen"
                )}
              >
                <Icon className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
              </span>
            </div>
            <p
              className={cn(
                "font-bold leading-[1.05] tracking-[-0.03em] num flex items-baseline gap-1.5",
                isGoal
                  ? "text-[28px] lg:text-[22px] text-cream"
                  : "text-[34px] lg:text-[28px] text-foreground"
              )}
            >
              <span className="truncate">{value}</span>
              {denom && (
                <span className="text-[17px] lg:text-[14px] font-medium text-muted-foreground tracking-[-0.01em]">
                  {denom}
                </span>
              )}
              {unit && (
                <span
                  className={cn(
                    "text-sm lg:text-[12px] font-medium tracking-normal",
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
                "mt-2 lg:mt-1 text-[12px] lg:text-[11px] leading-[1.5] lg:leading-[1.4] line-clamp-2 max-w-full",
                isGoal ? "text-cream/75" : "text-muted-foreground"
              )}
            >
              {sub}
            </p>
            {kind === "progress" && progressPct != null && (
              // C-5 (외부 리뷰 2026-05-12) — 진척도 바 가독성 보강.
              // 종전 h-1(4px) + bg-cream-deep 트랙은 명도 차가 작아 진척이 작을 때
              // 시각 인지 약함. h-1.5(6px) + bg-rule 트랙으로 대비 강화.
              <div className="mt-auto pt-3 lg:pt-2 h-1.5 overflow-hidden rounded-full bg-rule">
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
