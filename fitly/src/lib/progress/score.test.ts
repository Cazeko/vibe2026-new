import { describe, expect, test } from "vitest";
import { computeProgress } from "./score";

describe("computeProgress (헌법 v3.0 제9조)", () => {
  test("카드 0장이면 풀이/키워드 마스터율은 디폴트 50", () => {
    const r = computeProgress({
      quizTotal: 0,
      quizMastered: 0,
      keywordTotal: 0,
      keywordMastered: 0,
      recentStudyDaysOf14: 0,
    });
    expect(r.quizMasteryRate).toBe(50);
    expect(r.keywordMasteryRate).toBe(50);
    expect(r.studyConsistency).toBe(0);
    // 50*0.5 + 50*0.2 + 0*0.3 = 35
    expect(r.total).toBe(35);
  });

  test("완벽한 학습자(풀이 100% / 키워드 100% / 14일 연속)는 100", () => {
    const r = computeProgress({
      quizTotal: 100,
      quizMastered: 100,
      keywordTotal: 50,
      keywordMastered: 50,
      recentStudyDaysOf14: 14,
    });
    expect(r.quizMasteryRate).toBe(100);
    expect(r.keywordMasteryRate).toBe(100);
    expect(r.studyConsistency).toBe(100);
    expect(r.total).toBe(100);
  });

  test("일관성만 평균(50%)이고 카드 0장은 풀이·키워드 디폴트와 합쳐 50", () => {
    const r = computeProgress({
      quizTotal: 0,
      quizMastered: 0,
      keywordTotal: 0,
      keywordMastered: 0,
      recentStudyDaysOf14: 7,
    });
    // 50*0.5 + 50*0.2 + 50*0.3 = 50
    expect(r.total).toBe(50);
  });

  test("값은 항상 0~100 범위로 클램프된다", () => {
    const r = computeProgress({
      quizTotal: 10,
      quizMastered: 10,
      keywordTotal: 10,
      keywordMastered: 10,
      recentStudyDaysOf14: 14,
    });
    expect(r.quizMasteryRate).toBeLessThanOrEqual(100);
    expect(r.keywordMasteryRate).toBeLessThanOrEqual(100);
    expect(r.studyConsistency).toBeLessThanOrEqual(100);
    expect(r.total).toBeLessThanOrEqual(100);
    expect(r.total).toBeGreaterThanOrEqual(0);
  });
});
