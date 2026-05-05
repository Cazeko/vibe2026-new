import { describe, expect, test } from "vitest";
import { computeProgress } from "./score";

describe("computeProgress (헌법 v2.0 제9조)", () => {
  test("어휘 0장이면 어휘 마스터율은 디폴트 50", () => {
    const r = computeProgress({
      vocabTotal: 0,
      vocabMastered: 0,
      recentMistakeReviews: 0,
      recentMistakeCorrect: 0,
      recentStudyDaysOf14: 0,
    });
    expect(r.vocabMasteryRate).toBe(50);
    expect(r.mistakeConquerRate).toBe(50);
    expect(r.studyConsistency).toBe(0);
    // 50*0.4 + 50*0.3 + 0*0.3 = 35
    expect(r.total).toBe(35);
  });

  test("완벽한 학습자(어휘 100% / 오답 100% / 14일 연속)는 100", () => {
    const r = computeProgress({
      vocabTotal: 100,
      vocabMastered: 100,
      recentMistakeReviews: 50,
      recentMistakeCorrect: 50,
      recentStudyDaysOf14: 14,
    });
    expect(r.vocabMasteryRate).toBe(100);
    expect(r.mistakeConquerRate).toBe(100);
    expect(r.studyConsistency).toBe(100);
    expect(r.total).toBe(100);
  });

  test("일관성만 평균인 학습자(50%)는 어휘·오답 디폴트와 합쳐 합리적 범위", () => {
    const r = computeProgress({
      vocabTotal: 0,
      vocabMastered: 0,
      recentMistakeReviews: 0,
      recentMistakeCorrect: 0,
      recentStudyDaysOf14: 7,
    });
    // 50*0.4 + 50*0.3 + 50*0.3 = 50
    expect(r.total).toBe(50);
  });

  test("값은 항상 0~100 범위로 클램프된다", () => {
    const r = computeProgress({
      vocabTotal: 10,
      vocabMastered: 10,
      recentMistakeReviews: 10,
      recentMistakeCorrect: 10,
      recentStudyDaysOf14: 14,
    });
    expect(r.vocabMasteryRate).toBeLessThanOrEqual(100);
    expect(r.mistakeConquerRate).toBeLessThanOrEqual(100);
    expect(r.studyConsistency).toBeLessThanOrEqual(100);
    expect(r.total).toBeLessThanOrEqual(100);
    expect(r.total).toBeGreaterThanOrEqual(0);
  });
});
