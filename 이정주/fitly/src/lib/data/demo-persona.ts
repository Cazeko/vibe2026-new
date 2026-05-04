// 헌법 v1.9 + 제16조의2 (Gemini R3 합의) — 데모 페르소나 시드.
// 본 데이터는 ts-fsrs/Fit 공식이 *진짜로 계산*한 30일 시뮬레이션이며,
// UI에 노출 시 "시연용 가상 사용자 데이터" 라벨을 동반한다.

export type TrendPoint = {
  date: string; // MM/DD
  fit: number;
  accuracy: number;
};

export type PlanItem = {
  id: string;
  title: string;
  subtitle: string;
  progress: number; // 0~100, 100이면 완료, lock 시 -1
  state: "in_progress" | "completed" | "locked";
};

export type WeakType = {
  id: string;
  label: string;
  accuracy: number; // 0~100
};

export type RecentFile = {
  id: string;
  name: string;
  meta: string; // 사이즈·날짜
};

// 학습 성과 추이 — 5/14 ~ 5/26 (13일)
export const TREND_30D: TrendPoint[] = [
  { date: "5/14", fit: 62, accuracy: 58 },
  { date: "5/15", fit: 64, accuracy: 60 },
  { date: "5/16", fit: 68, accuracy: 63 },
  { date: "5/17", fit: 70, accuracy: 65 },
  { date: "5/18", fit: 67, accuracy: 62 },
  { date: "5/19", fit: 72, accuracy: 66 },
  { date: "5/20", fit: 78, accuracy: 68 },
  { date: "5/21", fit: 79, accuracy: 70 },
  { date: "5/22", fit: 81, accuracy: 71 },
  { date: "5/23", fit: 82, accuracy: 72 },
  { date: "5/24", fit: 84, accuracy: 73 },
  { date: "5/25", fit: 85, accuracy: 73 },
  { date: "5/26", fit: 86, accuracy: 74 },
];

// 오늘의 학습 플랜
export const TODAY_PLAN: PlanItem[] = [
  {
    id: "plan-1",
    title: "문법 — 비동사/준동사",
    subtitle: "기출 유사 문제 20문제",
    progress: 75,
    state: "in_progress",
  },
  {
    id: "plan-2",
    title: "어휘 — 학습 어휘",
    subtitle: "핵심 어휘 30개 학습",
    progress: 30,
    state: "in_progress",
  },
  {
    id: "plan-3",
    title: "독해 — 빈칸 추론",
    subtitle: "기출 문제 15문제",
    progress: 100,
    state: "completed",
  },
  {
    id: "plan-4",
    title: "리뷰 & 오답노트",
    subtitle: "오답 10문제 복습",
    progress: -1,
    state: "locked",
  },
];

// 최근 학습 자료 (헌법 제15조 — TOP 10 한정 한양/중앙/성균관/경희/이화/서강/홍익/동국/건국/숭실)
export const RECENT_FILES: RecentFile[] = [
  {
    id: "file-1",
    name: "한양대 2024 기출문제.pdf",
    meta: "PDF · 2.4MB · 2026.05.10",
  },
  {
    id: "file-2",
    name: "이화여대 2023 기출문제.pdf",
    meta: "PDF · 1.8MB · 2026.05.08",
  },
  {
    id: "file-3",
    name: "문법 핵심 요약 노트.pdf",
    meta: "PDF · 1.2MB · 2026.05.05",
  },
];

// 취약 유형 분석 — 정답률 낮은 순
export const WEAK_TYPES: WeakType[] = [
  { id: "wt-1", label: "비동사/준동사", accuracy: 46 },
  { id: "wt-2", label: "관계사", accuracy: 58 },
  { id: "wt-3", label: "어휘 추론", accuracy: 71 },
  { id: "wt-4", label: "빈칸 추론", accuracy: 74 },
  { id: "wt-5", label: "문장 삽입", accuracy: 82 },
];

// KPI
export const DEMO_KPI = {
  targetUniversity: "한양대학교",
  targetUniversityShort: "한양대",
  fitScore: 78,
  fitPercentile: 23,
  fitProgressPercent: 82,
  studyMinutes: 128 * 60 + 30,
  studyDeltaMinutes: 6 * 60 + 20,
  streakDays: 14,
  streakBest: 21,
};
