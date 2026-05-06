// 헌법 v3.0 제9조 — 학습 진척도(Progress) 점수.
// 외부 합격 컷·평균 의존 0. 본인 학습 데이터만으로 산출.
//
//   Progress = (풀이 마스터율 × 0.5) + (키워드 마스터율 × 0.2) + (학습 일관성 × 0.3)
//
//   풀이 마스터율    = FSRS state ≥ Review 인 quiz cards 수 / 전체 quiz cards 수
//   키워드 마스터율  = FSRS state ≥ Review 인 keyword cards 수 / 전체 keyword cards 수
//   학습 일관성     = 최근 14일 학습한 일수 / 14
//
// 본 점수는 "본인 학습의 상대 진척도" 지표이며, 지역 교육청별 합격 적합도와는 무관하다.

import { clamp } from "@/lib/utils";

export type ProgressInputs = {
  quizTotal: number;          // 보유 풀이 카드 수
  quizMastered: number;       // FSRS state ≥ Review 인 풀이 카드 수
  keywordTotal: number;       // 보유 키워드 카드 수
  keywordMastered: number;    // FSRS state ≥ Review 인 키워드 카드 수
  recentStudyDaysOf14: number;        // 최근 14일 중 학습한 일수
};

export type ProgressBreakdown = {
  quizMasteryRate: number;        // 0~100
  keywordMasteryRate: number;     // 0~100
  studyConsistency: number;       // 0~100
  total: number;                  // 0~100
};

const W_QUIZ = 0.5;
const W_KEYWORD = 0.2;
const W_CONSISTENCY = 0.3;

// 시드 적재 전(카드 0장) 시점에는 마스터율을 50 으로 가정한다.
// 0 으로 노출되는 것은 페널티이지 정직 라벨이 아니므로.
const DEFAULT_BEFORE_SEED = 50;

export function computeProgress(inputs: ProgressInputs): ProgressBreakdown {
  const quizMasteryRate =
    inputs.quizTotal === 0
      ? DEFAULT_BEFORE_SEED
      : Math.round((inputs.quizMastered / inputs.quizTotal) * 100);

  const keywordMasteryRate =
    inputs.keywordTotal === 0
      ? DEFAULT_BEFORE_SEED
      : Math.round((inputs.keywordMastered / inputs.keywordTotal) * 100);

  const studyConsistency = Math.round((inputs.recentStudyDaysOf14 / 14) * 100);

  const total = Math.round(
    quizMasteryRate * W_QUIZ +
      keywordMasteryRate * W_KEYWORD +
      studyConsistency * W_CONSISTENCY,
  );

  return {
    quizMasteryRate: clamp(quizMasteryRate, 0, 100),
    keywordMasteryRate: clamp(keywordMasteryRate, 0, 100),
    studyConsistency: clamp(studyConsistency, 0, 100),
    total: clamp(total, 0, 100),
  };
}
