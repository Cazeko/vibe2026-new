// 헌법 v3.0 제13조 6번 — 학습 계획 일일 목표 산식.
// 코드리뷰 M21 (2026-05-15) — study-plan/page.tsx 의 매직 넘버 (60/30/15/25/40)
// 를 본 모듈로 분리. 의미 있는 상수명 + 향후 헌법 §11 Progress 공식과 정합 시
// 단일 진입점.

// 키워드 일일 목표 임계점 (시험까지 남은 일수 기준).
//   60일 초과: 여유 구간 — 핵심 키워드 15개/일 (탐색·이해)
//   30~60일 : 표준 구간 — 25개/일 (확장·반복)
//   30일 이하: 집중 구간 — 40개/일 (마지막 정리)
// 본 임계점은 외부 평가·운영 경험을 토대로 조정 가능하며, 변경 시 헌법 §11
// Progress 산식과의 정합 점검 의무 (제24조의2).
const KEYWORD_DAILY_LOOSE_THRESHOLD_DAYS = 60;
const KEYWORD_DAILY_STANDARD_THRESHOLD_DAYS = 30;
const KEYWORD_DAILY_LOOSE = 15;
const KEYWORD_DAILY_STANDARD = 25;
const KEYWORD_DAILY_INTENSIVE = 40;

const QUIZ_DAILY_MIN = 3;
const MISTAKE_DAILY_MIN = 3;

const MINUTES_DAILY_BASE = 20;
const MINUTES_DAILY_MAX = 180;
const MINUTES_PER_QUIZ_CARD = 4;
const MINUTES_PER_KEYWORD_CARD = 0.5;
const MINUTES_PER_MISTAKE_CARD = 2;

export function computeKeywordDaily(daysToExam: number): number {
  if (daysToExam > KEYWORD_DAILY_LOOSE_THRESHOLD_DAYS) return KEYWORD_DAILY_LOOSE;
  if (daysToExam > KEYWORD_DAILY_STANDARD_THRESHOLD_DAYS)
    return KEYWORD_DAILY_STANDARD;
  return KEYWORD_DAILY_INTENSIVE;
}

export function computeQuizDaily(quizLib: number, daysToExam: number): number {
  const safeDays = Math.max(1, daysToExam);
  return Math.max(QUIZ_DAILY_MIN, Math.ceil(quizLib / safeDays));
}

export function computeMistakeDaily(
  mistakeLib: number,
  daysToExam: number,
): number {
  const safeDays = Math.max(1, daysToExam);
  return Math.max(
    MISTAKE_DAILY_MIN,
    Math.ceil(mistakeLib / Math.max(1, Math.floor(safeDays / 2))),
  );
}

export function computeMinutesDaily(
  quizDaily: number,
  keywordDaily: number,
  mistakeDaily: number,
): number {
  const raw =
    MINUTES_DAILY_BASE +
    Math.round(
      quizDaily * MINUTES_PER_QUIZ_CARD +
        keywordDaily * MINUTES_PER_KEYWORD_CARD +
        mistakeDaily * MINUTES_PER_MISTAKE_CARD,
    );
  return Math.min(MINUTES_DAILY_MAX, raw);
}
