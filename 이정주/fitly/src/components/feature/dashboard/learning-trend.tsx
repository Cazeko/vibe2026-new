"use client";

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
// 헌법 v1.10 — 데이터는 props 로만 주입(서버 컴포넌트가 페치).
export function LearningTrend({ data }: { data: TrendPoint[] }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const grid = dark ? "#1e2738" : "#eef0f5";
  const axis = dark ? "#6b7388" : "#9aa0ad";
  const fitColor = dark ? "#8b9aff" : "#5b6cff";
  const accColor = dark ? "#c4cbff" : "#b1baff";
  const tooltipBg = dark ? "#1a2030" : "#ffffff";
  const tooltipBorder = dark ? "#2a3145" : "#e5e7eb";

  const hasData = data.some((d) => d.fit != null || d.accuracy != null);

  return (
    <Card className="rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)] h-full">
      <CardContent className="p-4 h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">학습 성과 추이</h2>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <Legend color={fitColor} label="Fit 점수" />
            <Legend color={accColor} label="정답률(%)" />
          </div>
        </div>

        <div className="mt-2 h-44">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
              >
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke={axis}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={axis}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: `1px solid ${tooltipBorder}`,
                    background: tooltipBg,
                    fontSize: 11,
                    padding: "6px 10px",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "fit" ? `${value}` : `${value}%`,
                    name === "fit" ? "Fit 점수" : "정답률",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="fit"
                  stroke={fitColor}
                  strokeWidth={2.25}
                  dot={{ r: 2.5, fill: fitColor }}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke={accColor}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: accColor }}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-center text-[12px] text-muted-foreground">
              학습을 시작하면 매일 Fit·정답률 추이가 그려집니다.
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
