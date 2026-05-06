// 헌법 v2.0 — 대시보드 실데이터 DTO. 모든 위젯이 본 타입을 공유한다.

export type TrendPoint = {
  date: string;          // MM/DD
  progress: number | null;   // 학습 진척도 0~100 (v2.0 — 종전 fit 폐지)
  accuracy: number | null;
};

export type PlanItem = {
  id: string;
  title: string;
  subtitle: string;
  progress: number;      // 0~100
  state: "in_progress" | "completed" | "locked";
  href: string;
};

export type WeakType = {
  id: string;
  label: string;
  accuracy: number;      // 0~100
  total: number;
};

export type DashboardKpi = {
  // v3.0 — 지역 교육청 라벨(선택 입력, 제15조). 합격 컷·평균은 비공개이므로 보유하지 않는다.
  targetRegion: string | null;
  targetRegionShort: string | null;
  // v3.0 — 학습 진척도(Progress) 점수. 본인 학습 데이터로만 산출 (제9조).
  // 공식: 풀이 마스터율 × 0.5 + 키워드 마스터율 × 0.2 + 학습 일관성 × 0.3
  progressScore: number;
  progressBreakdown: {
    quizMasteryRate: number;
    keywordMasteryRate: number;
    studyConsistency: number;
  };
  studyMinutes: number;
  studyDeltaMinutes: number;
  streakDays: number;
  streakBest: number;
  daysToExam: number | null;
};

export type DashboardSummary = {
  kpi: DashboardKpi;
  trend: TrendPoint[];
  plan: PlanItem[];
  weakTypes: WeakType[];
  isEmpty: boolean;      // 새 사용자 여부 (모든 카운트 0)
};
