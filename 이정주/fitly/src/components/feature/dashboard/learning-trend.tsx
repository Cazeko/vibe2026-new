"use client";

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
import { TREND_30D } from "@/lib/data/demo-persona";

// 헌법 제19조 — 차트는 Recharts 우선.
export function LearningTrend() {
  return (
    <Card className="rounded-2xl border-0 shadow-sm h-full">
      <CardContent className="p-5 h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">학습 성과 추이</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Legend color="#5b6cff" label="Fit 점수" />
            <Legend color="#9ca7ff" label="정답률(%)" />
          </div>
        </div>

        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={TREND_30D}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid stroke="#eef0f5" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#9aa0ad"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#9aa0ad"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [
                  name === "fit" ? `${value}` : `${value}%`,
                  name === "fit" ? "Fit 점수" : "정답률",
                ]}
                labelFormatter={(l) => `${l}`}
              />
              <Line
                type="monotone"
                dataKey="fit"
                stroke="#5b6cff"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#5b6cff" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#9ca7ff"
                strokeWidth={2}
                dot={{ r: 3, fill: "#9ca7ff" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
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
