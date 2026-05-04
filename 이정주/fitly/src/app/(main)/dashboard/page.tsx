import { DashboardHeader } from "@/components/shared/dashboard-header";
import { KpiCards } from "@/components/feature/dashboard/kpi-cards";
import { LearningTrend } from "@/components/feature/dashboard/learning-trend";
import { TodayPlan } from "@/components/feature/dashboard/today-plan";
import { RecentMaterials } from "@/components/feature/dashboard/recent-materials";
import { WeakTypes } from "@/components/feature/dashboard/weak-types";
import { AiRecommend } from "@/components/feature/dashboard/ai-recommend";

// 헌법 v1.9 제13조 1번 — 대시보드.
export default function DashboardPage() {
  return (
    <div className="min-h-screen pb-10">
      <DashboardHeader />

      <div className="px-8 space-y-5">
        <KpiCards />

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <LearningTrend />
          </div>
          <div>
            <TodayPlan />
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <RecentMaterials />
          <WeakTypes />
          <AiRecommend />
        </section>

        <p className="pt-2 text-[11px] text-muted-foreground">
          본 화면의 KPI·차트·플랜은 <strong>시연용 가상 사용자 데이터</strong>
          입니다 (헌법 v1.9 제16조의2 정신). 실제 데이터로 점진적으로 교체될
          예정이며, 합격 컷·평균은 공시·합격 수기·인터뷰의 교차 검증을
          거칩니다 (제11조).
        </p>
      </div>
    </div>
  );
}
