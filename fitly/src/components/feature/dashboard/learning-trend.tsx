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

  const hasData = data.some((d) => d.progress != null || d.accuracy != null);

  return (
    <article className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5 h-full">
      <div className="flex items-center gap-2.5">
        <h2 className="font-sans text-[17px] font-bold tracking-[-0.02em] text-foreground">
          학습 성과 추이
        </h2>
        <div className="ml-auto flex items-center gap-3.5 text-[11.5px] text-muted-foreground">
          <Legend color={colors.progress} label="진척도" />
          <Legend color={colors.accuracy} label="정답률(%)" />
        </div>
      </div>
      <p className="mt-[2px] mb-[10px] text-[13px] text-muted-foreground leading-[1.5] tracking-[-0.005em]">
        최근 14일간의 일일 진척도와 정답률 흐름.
      </p>

      <div className="h-[240px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 12, right: 8, left: -18, bottom: 0 }}
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
              <YAxis
                domain={[0, 100]}
                stroke={colors.axis}
                fontSize={10.5}
                tickLine={false}
                axisLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${colors.tooltipBorder}`,
                  background: colors.tooltipBg,
                  fontSize: 11,
                  padding: "6px 10px",
                }}
                formatter={(value: number, name: string) => [
                  name === "progress" ? `${value}` : `${value}%`,
                  name === "progress" ? "학습 진척도" : "정답률",
                ]}
              />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke={colors.accuracy}
                strokeWidth={1.6}
                fill="url(#accuracyFill)"
                dot={{ r: 2.5, fill: colors.accuracy, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="progress"
                stroke={colors.progress}
                strokeWidth={2.4}
                dot={{ r: 3, fill: colors.progress, strokeWidth: 0 }}
                activeDot={{ r: 4.5 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center text-center text-[12px] text-muted-foreground">
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
