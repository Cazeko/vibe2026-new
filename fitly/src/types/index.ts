// 헌법 v3.0 제15조 — 지역 교육청 17개 라벨 (선택 입력).
export const REGION_NAMES = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;

export type RegionName = (typeof REGION_NAMES)[number];

// v3.0 — 학교별 합격 컷·가중치 의존 폐지. `lib/fit/*` 전부 제거됨.
// 본인 학습 데이터로 산출되는 진척도는 `lib/progress/score.ts` 에 정의되어 있다.

/**
 * 헌법 v3.0 제13조의2 — 학습 카드 분류 (cards 다형 단일 테이블).
 * QuizCard / KeywordCard / MistakeCard.
 */
export type CardType = "quiz" | "keyword" | "mistake";

/**
 * 헌법 제30조의2 — 정답·해설 4계층 출처 모델 (v1.8)
 *
 * - official            : 학교 공시 정답 또는 1차 출처
 * - ai_estimate         : Gemini가 본문에서 추정 (콜드 스타트)
 * - user_self_corrected : 본인이 자기 카드를 직접 정정 (단일 의견)
 * - crowd_verified      : 2명 이상 서로 다른 사용자가 동일 답을 제출
 */
export type AnswerSource =
  | "official"
  | "ai_estimate"
  | "user_self_corrected"
  | "crowd_verified";

export type SrsState = {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: string;
};
