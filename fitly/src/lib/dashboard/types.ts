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

export type RecentMaterial = {
  id: string;
  name: string;
  meta: string;          // MIME · size · 날짜
};

export type DashboardKpi = {
  targetUniversity: string | null;
  targetUniversityShort: string | null;
  // v2.0 — 학습 진척도(Progress) 점수. 본인 학습 데이터로만 산출 (제9조).
  progressScore: number;
  progressBreakdown: {
    vocabMasteryRate: number;
    mistakeConquerRate: number;
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
  recent: RecentMaterial[];
  isEmpty: boolean;      // 새 사용자 여부 (모든 카운트 0)
};
