"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { clamp } from "@/lib/utils";

type FitGaugeProps = {
  value: number;
  university?: string;
};

const SIZE = 200;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function FitGauge({ value, university }: FitGaugeProps) {
  const target = clamp(Math.round(value), 0, 100);
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const duration = 700;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const offset = CIRC * (1 - display / 100);

  return (
    <Card className="overflow-hidden">
      <CardContent className="relative flex flex-col items-center gap-3 px-6 py-7">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          학습 적합도
        </p>
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="-rotate-90"
            aria-hidden
          >
            <defs>
              <linearGradient
                id="fit-gauge-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="hsl(var(--gauge-from))" />
                <stop offset="100%" stopColor="hsl(var(--gauge-to))" />
              </linearGradient>
            </defs>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={STROKE}
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="url(#fit-gauge-gradient)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 80ms linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="num text-5xl font-extrabold tracking-tight">
              {display}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        <p
          className="text-sm font-semibold text-foreground"
          aria-live="polite"
        >
          {university ? `${university}대` : "학교를 선택하세요"}
        </p>
        <p className="text-[11px] text-muted-foreground">
          참고용 지표이며, 합격을 보장하지 않습니다.
        </p>
      </CardContent>
    </Card>
  );
}
