import { describe, it, expect } from "vitest";
import { clamp, daysUntil, cn } from "./utils";

describe("clamp", () => {
  it("범위 안이면 그대로", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it("최소보다 작으면 최소", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });
  it("최대보다 크면 최대", () => {
    expect(clamp(20, 0, 10)).toBe(10);
  });
});

describe("daysUntil", () => {
  it("과거 날짜는 0", () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5);
    expect(daysUntil(past)).toBe(0);
  });
  it("미래 7일", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    expect(daysUntil(future)).toBeGreaterThanOrEqual(7);
    expect(daysUntil(future)).toBeLessThanOrEqual(8);
  });
});

describe("cn", () => {
  it("클래스 병합 + tailwind 충돌 해소", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
