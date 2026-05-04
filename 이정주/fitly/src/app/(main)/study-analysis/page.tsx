import { PageHeader } from "@/components/shared/page-header";
import { LearningTrend } from "@/components/feature/dashboard/learning-trend";
import { WeakTypes } from "@/components/feature/dashboard/weak-types";

// 헌법 v1.9 제13조 5번 — 학습 분석 (대시보드의 분석 위젯을 확대 노출).
export default function StudyAnalysisPage() {
  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="학습 분석"
        subtitle="Fit 점수·정답률 추이와 취약 유형을 한눈에 확인하세요."
      />
      <div className="px-8 grid grid-cols-1 xl:grid-cols-2 gap-5">
        <LearningTrend />
        <WeakTypes />
      </div>
      <p className="px-8 pt-3 text-[11px] text-muted-foreground">
        시연용 가상 사용자 데이터 (헌법 v1.9 제16조의2 정신).
      </p>
    </div>
  );
}
