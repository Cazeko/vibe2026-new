export type UniversityName =
  | "한양"
  | "중앙"
  | "성균관"
  | "경희"
  | "이화"
  | "서강"
  | "홍익"
  | "동국"
  | "건국"
  | "숭실";

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
 * 헌법 제30조의2 — 정답·해설 3계층 출처 모델 (v1.7)
 */
export type AnswerSource = "official" | "ai_estimate" | "crowd_verified";

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
