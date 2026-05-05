"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { TrendPoint } from "@/lib/dashboard/types";

// 헌법 제19조 — 차트는 Recharts.
// 헌법 v2.1 제16조의2 — accent(evergreen)는 단일 시리즈만, 보조 시리즈는 명도 단계로 구분.
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
    tooltipBg: "transparent",
    tooltipBorder: "transparent",
  });

  // 다크/라이트 토큰을 클라이언트에서 추출 — Recharts 가 inline color string 만 받기 때문
  useEffect(() => {
    setColors({
      grid: readVar("--color-rule", "#e8e2d5"),
      axis: readVar("--color-text-muted", "#6b6256"),
      progress: readVar("--color-accent", "#1f5c4a"),
      // 보조 시리즈(정답률) — accent 와 같은 hue, 더 밝은 명도
      accuracy: readVar("--color-accent-strong", "#173f33") + "55", // ~33% alpha
      tooltipBg: readVar("--color-surface", "#fffaf1"),
      tooltipBorder: readVar("--color-rule", "#e8e2d5"),
    });
  }, [resolvedTheme]);

  const hasData = data.some((d) => d.progress != null || d.accuracy != null);

  return (
    <Card className="border-rule h-full">
      <CardContent className="p-5 h-full">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-medium tracking-tight">
            학습 성과 추이
          </h2>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <Legend color={colors.progress} label="진척도" />
            <Legend color={colors.accuracy} label="정답률(%)" />
          </div>
        </div>

        <div className="mt-3 h-44">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
              >
                <CartesianGrid stroke={colors.grid} strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke={colors.axis}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={colors.axis}
                  fontSize={10}
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
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke={colors.progress}
                  strokeWidth={2.25}
                  dot={{ r: 2.5, fill: colors.progress }}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke={colors.accuracy}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: colors.accuracy }}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-center text-[12px] text-muted-foreground">
              학습을 시작하면 매일 진척도·정답률 추이가 그려집니다.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
