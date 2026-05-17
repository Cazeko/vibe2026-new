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
    // 헌법 제24조의2 정합 — viewport fit:
    // - 모바일·태블릿·좁은 데스크톱·구형 노트북(<2xl): 자연 스크롤 (콘텐츠 우선)
    // - 2xl+(≥1400px): h-screen + overflow-hidden + flex column 으로 한 화면 분배
    // P0-12 (외부 평가 2026-05-12) — 종전 lg(1024) 임계 → xl(1280) 1차 상향.
    // 2026-05-17 (팀원 1366×768 노트북 보고) — xl 도 1178×704 콘텐츠 영역에서
    // flex-1 분배 잔여 공간 부족으로 차트·약점 카드가 클리핑되어 카드끼리
    // 시각적 겹침 회귀. 2xl(1400) 로 추가 상향 — 1440×900 이상 모니터에서만
    // viewport-fit 활성, 그 미만은 자연 스크롤. 수평 그리드(xl:grid-cols-4)는
    // 폭 결정이므로 유지 (alignment 보존).
    <div className="min-h-screen pb-12 2xl:h-screen 2xl:pb-0 2xl:overflow-hidden 2xl:flex 2xl:flex-col">
      <DashboardHeader />

      <div className="grid gap-[18px] sm:gap-[22px] px-4 sm:px-6 lg:px-10 py-5 lg:py-7 2xl:flex 2xl:flex-col 2xl:gap-3 2xl:px-8 2xl:py-4 2xl:flex-1 2xl:min-h-0">
        {summary.isEmpty && <OnboardingBanner />}

        <KpiCards kpi={summary.kpi} />

        {/* 주인님 발화 (2026-05-15) — 대시보드 오와열 정렬.
            상단 KpiCards 4 col grid 와 아래 LearningTrend/TodayPlan 폭이 정합되도록
            xl 이상에서 동일 4 col grid 사용 + col-span 분배 (3:1).
            학습성과추이 ↔ KPI 1~3번째(목표/학습진척도/최근7일) 폭 정합.
            오늘의 학습 플랜 ↔ KPI 4번째(연속학습) 폭 정합. */}
        <section className="grid grid-cols-1 xl:grid-cols-4 gap-[22px] xl:gap-3 2xl:flex-1 2xl:min-h-0">
          <div className="xl:col-span-3 min-w-0">
            <LearningTrend data={summary.trend} />
          </div>
          <div className="xl:col-span-1 min-w-0">
            <TodayPlan items={summary.plan} />
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_1.05fr] gap-[22px] xl:gap-3 2xl:flex-1 2xl:min-h-0">
          <WeakTypes items={summary.weakTypes} />
          <AiRecommend weakest={weakest} />
        </section>

        {/* K1 (헌법 제4조의3 정합) — 한글 줄바꿈 의미 단위 br.
            2xl+ viewport fit 에서는 disclaimer 1줄로 압축. */}
        <p className="pt-2 2xl:pt-0 max-w-[920px] text-[11.5px] 2xl:text-[10.5px] text-muted-foreground leading-[1.6] 2xl:leading-[1.4] shrink-0">
          본 대시보드의 KPI·차트·플랜은{" "}
          <strong className="font-semibold text-muted2-deep">
            본인 계정의 실제 학습 기록
          </strong>
          만으로 산출됩니다.
          <br className="hidden sm:inline 2xl:hidden" />
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
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-evergreen px-3 text-[12.5px] font-semibold text-primary-foreground hover:bg-evergreen-strong transition-colors"
        >
          2) 기출 분석 시작
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

