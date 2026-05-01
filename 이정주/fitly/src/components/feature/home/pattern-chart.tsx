"use client";

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PatternChartProps = {
  weights: { vocab: number; grammar: number; reading: number } | null;
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];

export function PatternChart({ weights }: PatternChartProps) {
  if (!weights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">출제 패턴</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          학교를 선택하면 어휘·문법·독해 출제 비중이 표시됩니다.
        </CardContent>
      </Card>
    );
  }

  const data = [
    { name: "어휘", value: weights.vocab },
    { name: "문법", value: weights.grammar },
    { name: "독해", value: weights.reading },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">출제 패턴</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <div className="h-28 w-28 shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={28}
                outerRadius={48}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, name: string) => [`${v}%`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 space-y-1.5 text-xs">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[i] }}
                  aria-hidden
                />
                {d.name}
              </span>
              <span className="num font-semibold">{d.value}%</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
