"use client";

import { useEffect, useState } from "react";
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

function readVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `hsl(${v})` : fallback;
}

// 헌법 v2.1 제16조의2 — 다중 시리즈는 액센트(evergreen) 명도 단계 + desaturated info/warning 으로.
export function SectionBars({ data }: { data: SectionBarItem[] }) {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState({
    grid: "transparent",
    tick: "transparent",
    bg: "transparent",
    vocab: "transparent",
    grammar: "transparent",
    reading: "transparent",
  });

  useEffect(() => {
    setColors({
      grid: readVar("--color-rule", "#e8e2d5"),
      tick: readVar("--color-text-muted", "#6b6256"),
      bg: readVar("--color-surface", "#fffaf1"),
      // 어휘 = evergreen (강), 문법 = info (중간), 독해 = warning (강조 보조)
      vocab: readVar("--color-accent", "#1f5c4a"),
      grammar: readVar("--color-info", "#2e4a6b"),
      reading: readVar("--color-warning", "#b5862d"),
    });
  }, [resolvedTheme]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" stroke={colors.tick} tick={{ fontSize: 10 }} />
        <YAxis stroke={colors.tick} tick={{ fontSize: 10 }} domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            background: colors.bg,
            border: `1px solid ${colors.grid}`,
            borderRadius: 8,
            fontSize: 11,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} iconType="circle" />
        <Bar dataKey="vocab" name="어휘" fill={colors.vocab} radius={[4, 4, 0, 0]} />
        <Bar dataKey="grammar" name="문법" fill={colors.grammar} radius={[4, 4, 0, 0]} />
        <Bar dataKey="reading" name="독해" fill={colors.reading} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
