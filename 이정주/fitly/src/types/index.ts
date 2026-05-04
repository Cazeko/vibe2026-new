export const UNIVERSITY_NAMES = [
  "한양",
  "중앙",
  "성균관",
  "경희",
  "이화",
  "서강",
  "홍익",
  "동국",
  "건국",
  "숭실",
] as const;

export type UniversityName = (typeof UNIVERSITY_NAMES)[number];

export type {
  Cutoffs,
  Weights,
  UserSectionScores,
  SectionKey,
} from "@/lib/fit/score";

/**
 * 헌법 제13조의2 — 학습 카드 분류 (v1.6)
 */

export type CardSource = "mistake_upload" | "study_rag" | "vocab_seed";

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

export type MistakeCard = {
  question: string;
  choices?: string[];
  answer?: string;
  explanation?: string;
  keywords: string[];
  answerSource?: AnswerSource;
};

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
