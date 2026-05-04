import Link from "next/link";
import { Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WeakType } from "@/lib/dashboard/types";

// 헌법 v1.10 — AI 추천 학습은 취약 유형 분석을 *집계·재배열*한 산출물.
// 헌법 제18조의2 — AI 추천에 "검증 필요" 정신을 반영한 가벼운 코칭 카피.
export function AiRecommend({ weakest }: { weakest: WeakType | null }) {
  return (
    <Card className="rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)] h-full bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/15 dark:to-violet-500/10">
      <CardContent className="p-4 h-full flex flex-col">
        <h2 className="text-sm font-bold">AI 추천 학습</h2>

        <div className="mt-2 flex-1">
          <p className="text-[12px] text-foreground leading-relaxed">
            {weakest ? (
              <>
                지금{" "}
                <span className="font-semibold text-primary">
                  {weakest.label}
                </span>{" "}
                유형을 집중하면
                <br />
                Fit 점수를 더 빠르게 올릴 수 있어요!
              </>
            ) : (
              <>
                기출 풀이를 시작하면
                <br />
                AI가 취약 유형을 분석해 드립니다.
              </>
            )}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            ※ AI 추천은 본인 학습 이력 집계 산출물 (검증 필요).
          </p>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <Button asChild size="sm" className="h-8 rounded-xl px-3 text-xs shadow-sm">
            <Link href="/study/exam">추천 문제 풀기</Link>
          </Button>
          <span
            aria-hidden
            className="grid h-10 w-10 place-items-center rounded-xl bg-white/70 text-indigo-500 shadow-sm dark:bg-white/10 dark:text-indigo-300"
          >
            <Bot className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
