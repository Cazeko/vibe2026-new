// 헌법 v2.0 제9조 — 학습 진척도(Progress) 점수.
// 외부 합격 컷·평균 의존 0. 본인 학습 데이터만으로 산출.
//
//   Progress = (어휘 마스터율 × 0.4) + (오답 정복률 × 0.3) + (학습 일관성 × 0.3)
//
// 본 점수는 "본인 학습의 상대 진척도" 지표이며, 학교별 합격 적합도와는 무관하다.

import { clamp } from "@/lib/utils";

export type ProgressInputs = {
  vocabTotal: number;        // 보유 어휘 카드 수
  vocabMastered: number;     // SRS state ≥ Review 인 어휘 카드 수
  recentMistakeReviews: number;       // 최근 14일 오답 리뷰 횟수
  recentMistakeCorrect: number;       // 그 중 good/easy 등급 횟수
  recentStudyDaysOf14: number;        // 최근 14일 중 학습한 일수
};

export type ProgressBreakdown = {
  vocabMasteryRate: number;       // 0~100
  mistakeConquerRate: number;     // 0~100
  studyConsistency: number;       // 0~100
  total: number;                  // 0~100
};

const W_VOCAB = 0.4;
const W_MISTAKE = 0.3;
const W_CONSISTENCY = 0.3;

// 사용자가 어휘를 한 장도 등록하지 않은 시점에는 어휘 마스터율을 50 으로 가정한다
// (시드 도입 직후 0 이 보이는 것은 페널티이지 정직 라벨이 아니므로).
// 단, 어휘 시드 적재 후에도 0 인 경우는 0 그대로.
const VOCAB_DEFAULT_BEFORE_SEED = 50;

export function computeProgress(inputs: ProgressInputs): ProgressBreakdown {
  const vocabMasteryRate =
    inputs.vocabTotal === 0
      ? VOCAB_DEFAULT_BEFORE_SEED
      : Math.round((inputs.vocabMastered / inputs.vocabTotal) * 100);

  const mistakeConquerRate =
    inputs.recentMistakeReviews === 0
      ? 50 // 리뷰 데이터 없을 땐 중립값
      : Math.round(
          (inputs.recentMistakeCorrect / inputs.recentMistakeReviews) * 100,
        );

  const studyConsistency = Math.round((inputs.recentStudyDaysOf14 / 14) * 100);

  const total = Math.round(
    vocabMasteryRate * W_VOCAB +
      mistakeConquerRate * W_MISTAKE +
      studyConsistency * W_CONSISTENCY,
  );

  return {
    vocabMasteryRate: clamp(vocabMasteryRate, 0, 100),
    mistakeConquerRate: clamp(mistakeConquerRate, 0, 100),
    studyConsistency: clamp(studyConsistency, 0, 100),
    total: clamp(total, 0, 100),
  };
}
