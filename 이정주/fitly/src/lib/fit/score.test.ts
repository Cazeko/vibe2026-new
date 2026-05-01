import { describe, it, expect } from "vitest";
import { sectionPosition, computeFit } from "./score";

describe("sectionPosition (제9조 — Fit 공식)", () => {
  it("점수 = 컷이면 0%", () => {
    expect(sectionPosition(60, 60, 80)).toBe(0);
  });

  it("점수 = 평균이면 100%", () => {
    expect(sectionPosition(80, 60, 80)).toBe(100);
  });

  it("점수가 컷과 평균의 중간이면 50%", () => {
    expect(sectionPosition(70, 60, 80)).toBe(50);
  });

  it("평균 위로 초과해도 최대 150까지 클램프", () => {
    expect(sectionPosition(100, 60, 80)).toBe(150);
    expect(sectionPosition(200, 60, 80)).toBe(150);
  });

  it("컷 미만이면 음수, 최소 -50까지 클램프", () => {
    expect(sectionPosition(50, 60, 80)).toBe(-50);
    expect(sectionPosition(0, 60, 80)).toBe(-50);
  });

  it("avg ≤ cut인 비정상 데이터: 점수≥cut이면 100, 아니면 0", () => {
    expect(sectionPosition(70, 60, 60)).toBe(100);
    expect(sectionPosition(50, 60, 60)).toBe(0);
  });
});

describe("computeFit (가중 합)", () => {
  const cutoffs = {
    vocab_cut: 60,
    vocab_avg: 80,
    grammar_cut: 50,
    grammar_avg: 70,
    reading_cut: 55,
    reading_avg: 75,
  };
  const weights = { vocab: 40, grammar: 30, reading: 30 };

  it("모든 영역이 평균이면 total = 100", () => {
    const r = computeFit(
      { vocab: 80, grammar: 70, reading: 75 },
      cutoffs,
      weights
    );
    expect(r.total).toBe(100);
  });

  it("모든 영역이 컷이면 total = 0", () => {
    const r = computeFit(
      { vocab: 60, grammar: 50, reading: 55 },
      cutoffs,
      weights
    );
    expect(r.total).toBe(0);
  });

  it("가중치 0 합 방지: 합 0이어도 NaN 아님", () => {
    const r = computeFit(
      { vocab: 80, grammar: 70, reading: 75 },
      cutoffs,
      { vocab: 0, grammar: 0, reading: 0 }
    );
    expect(Number.isFinite(r.total)).toBe(true);
  });

  it("total은 0~150 클램프", () => {
    const high = computeFit(
      { vocab: 200, grammar: 200, reading: 200 },
      cutoffs,
      weights
    );
    expect(high.total).toBeLessThanOrEqual(150);

    const low = computeFit(
      { vocab: 0, grammar: 0, reading: 0 },
      cutoffs,
      weights
    );
    expect(low.total).toBeGreaterThanOrEqual(0);
  });

  it("영역별 위치를 함께 반환", () => {
    const r = computeFit(
      { vocab: 70, grammar: 60, reading: 65 },
      cutoffs,
      weights
    );
    expect(r.vocab).toBe(50);
    expect(r.grammar).toBe(50);
    expect(r.reading).toBe(50);
  });
});
