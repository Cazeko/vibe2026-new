"use client";

// 코드리뷰 M11 (2026-05-15) — Recharts 본체를 `next/dynamic` 으로 분리하여
// 대시보드/학습분석 페이지 초기 client 번들에서 ~100KB+ Recharts 의존성을 분할.
// SSR 비활성화 — 차트는 클라이언트에서만 렌더 (LazyMount 정합).

import dynamic from "next/dynamic";
import type { TrendPoint } from "@/lib/dashboard/types";

const LearningTrendChart = dynamic(
  () =>
    import("./learning-trend-chart").then((m) => ({
      default: m.LearningTrendChart,
    })),
  {
    ssr: false,
    loading: () => (
      <article className="rounded-card border border-rule bg-cream-soft h-full min-h-[180px] md:min-h-[240px] animate-pulse" />
    ),
  },
);

export function LearningTrend({ data }: { data: TrendPoint[] }) {
  return <LearningTrendChart data={data} />;
}
