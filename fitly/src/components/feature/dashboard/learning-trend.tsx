"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
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
import type { TrendPoint } from "@/lib/dashboard/types";

// 차트: 신규 디자인 정합 — 진척도(evergreen 라인) + 정답률(gold 면+라인)
function readVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `hsl(${v})` : fallback;
}

export function LearningTrend({ data }: { data: TrendPoint[] }) {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState({
    grid: "transparent",
    axis: "transparent",
    progress: "transparent",
    accuracy: "transparent",
    accuracyFill: "transparent",
    tooltipBg: "transparent",
    tooltipBorder: "transparent",
  });
  // S3 (헌법 제24조의2 정합) — prefers-reduced-motion 미디어 쿼리 → 차트 애니메이션 비활성화
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const gold = readVar("--color-gold", "#c9a55b");
    setColors({
      grid: readVar("--color-rule", "#e8e2d5"),
      axis: readVar("--color-text-muted", "#8a857a"),
      progress: readVar("--color-accent", "#1f4a3c"),
      accuracy: gold,
      accuracyFill: gold,
      tooltipBg: readVar("--color-surface", "#fbf8f1"),
      tooltipBorder: readVar("--color-rule", "#ebe3cf"),
    });
  }, [resolvedTheme]);

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
    // viewport fit (lg+) — article 을 flex column 으로 변경하여 차트가 잔여
    // 공간 차지. 헤더·subtitle 은 자기 높이, 차트 div 가 flex-1 흡수.
    <article className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5 lg:px-5 lg:pt-4 lg:pb-3 h-full flex flex-col">
      <div className="flex items-center gap-2.5 flex-wrap shrink-0">
        <h2 className="font-sans text-[17px] lg:text-[15px] font-bold tracking-[-0.02em] text-foreground">
          학습 성과 추이
        </h2>
        <div className="ml-auto flex items-center gap-3.5 text-[11.5px] text-muted-foreground">
          {/* H2 단위 명시 — 진척도도 % 단위 */}
          <Legend color={colors.progress} label="진척도(%)" />
          <Legend color={colors.accuracy} label="정답률(%)" />
        </div>
      </div>
      <p className="mt-[2px] mb-[10px] lg:mb-2 text-[13px] lg:text-[11.5px] text-muted-foreground leading-[1.5] tracking-[-0.005em] break-keep shrink-0">
        최근 14일간의 일일 진척도와 정답률 흐름.
      </p>

      {/* H4 모바일 180px / md+ 240px (헌법 제24조의2)
          viewport fit (lg+): flex-1 min-h-0 으로 잔여 vh 차지 */}
      <div className="h-[180px] md:h-[240px] lg:h-auto lg:flex-1 lg:min-h-0">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              // H1 margin 음수 제거 — YAxis width=36으로 left padding 흡수
              margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="accuracyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.accuracyFill} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={colors.accuracyFill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={colors.grid} strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="date"
                stroke={colors.axis}
                fontSize={10.5}
                tickLine={false}
                axisLine={false}
              />
              {/* H2 YAxis label — 진척도·정답률 단위 혼합 해소 */}
              <YAxis
                domain={[0, 100]}
                stroke={colors.axis}
                fontSize={10.5}
                tickLine={false}
                axisLine={false}
                ticks={[0, 25, 50, 75, 100]}
                width={36}
              />
              {/* P1-01 (외부 리뷰 2026-05-12) — Tooltip 가독성 보강:
                  - cursor 점선 라인 추가 (호버 위치 시각 어포던스, hit box 회피 위해 strokeDasharray)
                  - labelFormatter 로 일자 명확화 (MM/DD → "X월 X일")
                  - itemStyle 로 값 weight 강화 */}
              <Tooltip
                cursor={{
                  stroke: colors.axis,
                  strokeDasharray: "2 3",
                  strokeWidth: 1,
                }}
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${colors.tooltipBorder}`,
                  background: colors.tooltipBg,
                  fontSize: 11,
                  padding: "6px 10px",
                }}
                labelStyle={{
                  fontSize: 10.5,
                  color: colors.axis,
                  marginBottom: 2,
                }}
                itemStyle={{ fontWeight: 600 }}
                labelFormatter={(label: string) => {
                  const [m, d] = label.split("/");
                  return m && d ? `${Number(m)}월 ${Number(d)}일` : label;
                }}
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name === "progress" ? "학습 진척도" : "정답률",
                ]}
              />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke={colors.accuracy}
                strokeWidth={1.6}
                fill="url(#accuracyFill)"
                // H3 dot r 축소 (2.5 → 2)
                dot={{ r: 2, fill: colors.accuracy, strokeWidth: 0 }}
                activeDot={{ r: 3.5 }}
                connectNulls
                isAnimationActive={isAnimationActive}
              />
              <Line
                type="monotone"
                dataKey="progress"
                stroke={colors.progress}
                strokeWidth={2.4}
                // H3 dot r 축소 (3 → 2.5)
                dot={{ r: 2.5, fill: colors.progress, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls
                isAnimationActive={isAnimationActive}
              />
            </ComposedChart>
          </ResponsiveContainer>
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
