"use client";

// 헌법 v3.5.1 제16조 — 잔디(Streak) 얼리기 client action. 듀오링고 차용 retention
// 장치 (시행규칙 32 제34조 다듬기 정합). kpi-cards.tsx 의 streak 카드 sub 에 inject.

import { useState, useTransition } from "react";
import { Snowflake } from "lucide-react";
import { applyStreakFreezeToday } from "@/app/(main)/dashboard/actions";

export function StreakFreezeAction({ available }: { available: number }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-info">
        <Snowflake className="h-3 w-3" aria-hidden />
        오늘 잔디 얼림 적용됨
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          setErrMsg(null);
          const res = await applyStreakFreezeToday();
          if ("ok" in res) {
            setDone(true);
          } else {
            setErrMsg(
              res.error === "LimitReached"
                ? "이번 달 한도 소진"
                : res.error === "BadState"
                  ? "오늘 학습 기록 있음"
                  : "처리 실패",
            );
          }
        })
      }
      disabled={pending || available <= 0}
      aria-label={`잔디 얼리기 사용 — 잔여 ${available}회`}
      className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-info"
    >
      <Snowflake className="h-3 w-3" aria-hidden />
      {pending
        ? "적용 중…"
        : errMsg
          ? errMsg
          : `잔디 얼리기 (${available}회 남음)`}
    </button>
  );
}
