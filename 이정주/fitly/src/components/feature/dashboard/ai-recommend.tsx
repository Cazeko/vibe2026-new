import Link from "next/link";
import { Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WEAK_TYPES } from "@/lib/data/demo-persona";

// 헌법 v1.9 — AI 추천 학습은 취약 유형 분석을 *집계·재배열*한 산출물.
// 헌법 제18조의2 — AI 추천에 "검증 필요" 정신을 반영한 가벼운 코칭 카피.
export function AiRecommend() {
  const weakest = WEAK_TYPES[0];
  return (
    <Card className="rounded-2xl border-0 shadow-sm h-full bg-gradient-to-br from-indigo-50 to-violet-50">
      <CardContent className="p-5 h-full flex flex-col">
        <h2 className="text-base font-bold">AI 추천 학습</h2>

        <div className="mt-4 flex-1">
          <p className="text-sm text-foreground leading-relaxed">
            지금{" "}
            <span className="font-semibold text-primary">
              {weakest.label}
            </span>{" "}
            유형을 집중하면
            <br />
            Fit 점수를 더 빠르게 올릴 수 있어요!
          </p>
        </div>

        <div className="mt-4 flex items-end justify-between gap-2">
          <Button asChild className="rounded-xl shadow-sm">
            <Link href="/study/exam">추천 문제 풀기</Link>
          </Button>
          <span
            aria-hidden
            className="grid h-14 w-14 place-items-center rounded-2xl bg-white/70 text-indigo-500 shadow-sm"
          >
            <Bot className="h-7 w-7" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
