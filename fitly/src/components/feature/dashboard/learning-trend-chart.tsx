"use client";

// 코드리뷰 M11+M19 (2026-05-15) — Recharts 본체 코드를 본 파일로 분리.
// `learning-trend.tsx` 가 next/dynamic 으로 lazy-load 하여 대시보드/학습분석
// 페이지 초기 client 번들에서 분할한다.
//
// M19: useTheme + getComputedStyle 패턴 제거 → CSS 변수 직접 (`hsl(var(--...))`)
// 사용. globals.css 의 다크/라이트 분기가 자동으로 적용되며 첫 paint 의 transparent
// 깜빡임 회귀 해소.

import { useEffect, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LazyMount } from "@/components/shared/lazy-mount";
import type { TrendPoint } from "@/lib/dashboard/types";

// CSS 변수 정합. globals.css 의 light/dark 토큰을 그대로 inherit.
const COLORS = {
  grid: "hsl(var(--color-rule))",
  axis: "hsl(var(--color-text-muted))",
  progress: "hsl(var(--color-accent))",
  accuracy: "hsl(var(--color-gold))",
  accuracyFill: "hsl(var(--color-gold))",
  tooltipBg: "hsl(var(--color-surface))",
  tooltipBorder: "hsl(var(--color-rule))",
};

export function LearningTrendChart({ data }: { data: TrendPoint[] }) {
  // S3 (헌법 제24조의2 정합) — prefers-reduced-motion 미디어 쿼리 → 차트 애니메이션 비활성화
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // C1 (헌법 제24조의2 정합) — null != 0 강화. 누적 0 만 있어도 빈 상태로 처리.
  const hasData = data.some(
    (d) =>
      (typeof d.progress === "number" && d.progress > 0) ||
      (typeof d.accuracy === "number" && d.accuracy > 0),
  );
  const isAnimationActive = !reducedMotion;

  return (
    <article className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5 lg:px-5 lg:pt-4 lg:pb-3 h-full flex flex-col">
      <div className="flex items-center gap-2.5 flex-wrap shrink-0">
        <h2 className="font-sans text-[17px] lg:text-[15px] font-bold tracking-[-0.02em] text-foreground">
          학습 성과 추이
        </h2>
        <div className="ml-auto flex items-center gap-3.5 text-[11.5px] text-muted-foreground">
          <Legend color={COLORS.progress} label="진척도(%)" />
          <Legend color={COLORS.accuracy} label="정답률(%)" />
        </div>
      </div>
      <p className="mt-[2px] mb-[10px] lg:mb-2 text-[13px] lg:text-[11.5px] text-muted-foreground leading-[1.5] tracking-[-0.005em] break-keep shrink-0">
        최근 14일간의 일일 진척도와 정답률 흐름.
      </p>

      {/* 2026-05-18 — 빈 상태에서 lg:h-auto lg:flex-1 lg:min-h-0 가 viewport-fit
          미활성 구간(1280~1399)에서 부모 flex 컨텍스트 부재로 chart-div 가 거의
          0 으로 수축, 옆 카드(TodayPlan) 높이만큼 article h-full 이 확장되며
          빈 placeholder 가 카드 하단에 붙어 인접 섹션과 겹쳐 보이는 회귀.
          min-h floor 240px 추가, 2xl 부터는 viewport-fit 정합으로 min-h-0 해제. */}
      <div className="h-[180px] md:h-[240px] lg:flex-1 lg:min-h-[240px] 2xl:min-h-0">
        {hasData ? (
          <LazyMount minHeight="180px" rootMargin="240px 0px" className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="accuracyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.accuracyFill} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={COLORS.accuracyFill} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={COLORS.grid} strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke={COLORS.axis}
                  fontSize={10.5}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={COLORS.axis}
                  fontSize={10.5}
                  tickLine={false}
                  axisLine={false}
                  ticks={[0, 25, 50, 75, 100]}
                  width={36}
                />
                <Tooltip
                  cursor={{
                    stroke: COLORS.axis,
                    strokeDasharray: "2 3",
                    strokeWidth: 1,
                  }}
                  contentStyle={{
                    borderRadius: 8,
                    border: `1px solid ${COLORS.tooltipBorder}`,
                    background: COLORS.tooltipBg,
                    fontSize: 11,
                    padding: "6px 10px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                  }}
                  labelStyle={{
                    fontSize: 10.5,
                    color: COLORS.axis,
                    marginBottom: 2,
                    fontVariantNumeric: "tabular-nums",
                  }}
                  itemStyle={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                  labelFormatter={(label: string) => label}
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name === "progress" ? "학습 진척도" : "정답률",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  stroke={COLORS.accuracy}
                  strokeWidth={1.6}
                  fill="url(#accuracyFill)"
                  dot={{ r: 2, fill: COLORS.accuracy, strokeWidth: 0 }}
                  activeDot={{ r: 3.5 }}
                  connectNulls
                  isAnimationActive={isAnimationActive}
                />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke={COLORS.progress}
                  strokeWidth={2.4}
                  dot={{ r: 2.5, fill: COLORS.progress, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  connectNulls
                  isAnimationActive={isAnimationActive}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </LazyMount>
        ) : (
          <div className="grid h-full place-items-center text-center text-[12px] text-muted-foreground break-keep">
            학습을 시작하면 매일 진척도·정답률 추이가 그려집니다.
          </div>
        )}
      </div>
    </article>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
