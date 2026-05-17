import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { KpiCards } from "@/components/feature/dashboard/kpi-cards";
import { LearningTrend } from "@/components/feature/dashboard/learning-trend";
import { TodayPlan } from "@/components/feature/dashboard/today-plan";
import { WeakTypes } from "@/components/feature/dashboard/weak-types";
import { AiRecommend } from "@/components/feature/dashboard/ai-recommend";
import { OnboardingBanner } from "@/components/feature/dashboard/onboarding-banner";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary } from "@/lib/dashboard/queries";

// 헌법 v3.0 / v3.0.1 — 대시보드는 서버 컴포넌트로 단일 진입점 페치(getDashboardSummary).
// 모든 위젯은 props 만 받아 렌더링한다. 자료 업로드(v3.0.1 cut)·오답 위젯(Phase 2) 제거.
export const dynamic = "force-dynamic";

// N1 (헌법 제24조의2 정합) — 페이지 SEO/OG 메타데이터
export const metadata: Metadata = {
  title: "대시보드 · Fitly",
  description:
    "본인 학습 기록 기반의 진척도·연속 학습·정답률 KPI와 일일 플랜을 한눈에 확인합니다.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const summary = await getDashboardSummary(user.id);
  const weakest = summary.weakTypes[0] ?? null;

  return (
    // 2026-05-18 — viewport-fit 전면 제거.
    // 경위: PR #92 lg→2xl 격상, #96 min-h floor, #97 grid→flex, #98 67% 정렬,
    // #99 chart overflow-hidden 까지 누적 fix 했음에도 zoom·F11 변화 시 Section 2
    // 카드 겹침 회귀가 반복 보고됨. 근본 원인은 viewport-fit 의 `flex-1 min-h-0`
    // 분배가 zoom·F11 timing 에 따라 들쑥날쑥 계산되는 fragile 패턴. 안정성 우선
    // 으로 viewport-fit 완전 제거 — 모든 viewport 에서 자연 스크롤 + 고정 22px gap.
    // 콘텐츠가 길어지면 페이지 스크롤. 카드 겹침 0.
    <div className="min-h-screen pb-12">
      <DashboardHeader />

      <div className="flex flex-col gap-[18px] sm:gap-[22px] px-4 sm:px-6 lg:px-10 py-5 lg:py-7">
        <OnboardingBanner isEmpty={summary.isEmpty} />

        <KpiCards kpi={summary.kpi} />

        {/* 2026-05-18 — Section 1·2 컬럼 경계 정렬 (PR #98). 두 row 모두
            xl:grid-cols-3 + col-span 2:1 (67%) 로 통일. LT↔WT, TP↔AR 폭 일치. */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-[22px] xl:gap-3">
          <div className="xl:col-span-2 min-w-0">
            <LearningTrend data={summary.trend} />
          </div>
          <div className="xl:col-span-1 min-w-0">
            <TodayPlan items={summary.plan} />
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-[22px] xl:gap-3">
          <div className="xl:col-span-2 min-w-0">
            <WeakTypes items={summary.weakTypes} />
          </div>
          <div className="xl:col-span-1 min-w-0">
            <AiRecommend weakest={weakest} />
          </div>
        </section>

        {/* K1 (헌법 제4조의3 정합) — 한글 줄바꿈 의미 단위 br. */}
        <p className="pt-2 max-w-[920px] text-[11.5px] text-muted-foreground leading-[1.6]">
          본 대시보드의 KPI·차트·플랜은{" "}
          <strong className="font-semibold text-muted2-deep">
            본인 계정의 실제 학습 기록
          </strong>
          만으로 산출됩니다.
          <br className="hidden sm:inline" />
          지역 교육청별 합격 컷·평균은 비공개이므로 Fitly가 보유하지 않습니다.
        </p>
      </div>
    </div>
  );
}
