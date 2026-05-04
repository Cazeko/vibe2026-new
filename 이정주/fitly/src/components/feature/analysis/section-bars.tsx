"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";

export type SectionBarItem = {
  label: string;
  vocab: number;
  grammar: number;
  reading: number;
};

export function SectionBars({ data }: { data: SectionBarItem[] }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const grid = dark ? "#1e2738" : "#eef0f5";
  const tick = dark ? "#9ca3af" : "#6b7280";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" stroke={tick} tick={{ fontSize: 10 }} />
        <YAxis stroke={tick} tick={{ fontSize: 10 }} domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            background: dark ? "#0f172a" : "#ffffff",
            border: `1px solid ${grid}`,
            borderRadius: 8,
            fontSize: 11,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} iconType="circle" />
        <Bar dataKey="vocab" name="어휘" fill="#5b6cff" radius={[4, 4, 0, 0]} />
        <Bar dataKey="grammar" name="문법" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="reading" name="독해" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
