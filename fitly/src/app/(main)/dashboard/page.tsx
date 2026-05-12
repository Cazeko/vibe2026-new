import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { KpiCards } from "@/components/feature/dashboard/kpi-cards";
import { LearningTrend } from "@/components/feature/dashboard/learning-trend";
import { TodayPlan } from "@/components/feature/dashboard/today-plan";
import { WeakTypes } from "@/components/feature/dashboard/weak-types";
import { AiRecommend } from "@/components/feature/dashboard/ai-recommend";
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
    <div className="min-h-screen pb-12">
      <DashboardHeader />

      <div className="grid gap-[22px] px-10 py-7">
        {summary.isEmpty && <OnboardingBanner />}

        <KpiCards kpi={summary.kpi} />

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[22px]">
          <LearningTrend data={summary.trend} />
          <TodayPlan items={summary.plan} />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_1.05fr] gap-[22px]">
          <WeakTypes items={summary.weakTypes} />
          <AiRecommend weakest={weakest} />
        </section>

        {/* K1 (헌법 제4조의3 정합) — 한글 줄바꿈 의미 단위 br */}
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

function OnboardingBanner() {
  return (
    <article className="rounded-card border-l-[3px] border-l-evergreen border-y border-r border-rule bg-cream-soft px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-full bg-evergreen text-gold"
        >
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="font-sans text-[15px] font-bold tracking-[-0.02em]">
            Fitly 첫 방문을 환영합니다.
          </p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            아래 단계만 완료하시면 학습 진척도와 추이가 실시간으로 그려집니다.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="inline-flex h-9 items-center rounded-lg border border-rule-strong px-3 text-[12.5px] font-semibold text-muted2-deep hover:border-evergreen hover:text-evergreen transition-colors"
        >
          1) 시험일 등록
        </Link>
        <Link
          href="/exam-analysis"
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-evergreen px-3 text-[12.5px] font-semibold text-white hover:bg-evergreen-strong transition-colors"
        >
          2) 기출 분석 시작
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

