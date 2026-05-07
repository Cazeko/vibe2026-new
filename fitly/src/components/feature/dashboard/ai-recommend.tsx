import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WeakType } from "@/lib/dashboard/types";

// 헌법 v1.10 — AI 추천 학습은 취약 유형 분석을 *집계·재배열*한 산출물.
// 헌법 v2.1 제16조의2 — AI 추천 카드는 액센트(evergreen) 5번 — 강조 보더 + soft 배경.
export function AiRecommend({ weakest }: { weakest: WeakType | null }) {
  return (
    <Card className="h-full border-evergreen bg-evergreen/[0.06]">
      <CardContent className="p-5 h-full flex flex-col">
        <div className="flex items-start gap-3 flex-1">
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-evergreen text-primary-foreground font-serif italic font-medium text-base"
          >
            F
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-base font-medium tracking-tight leading-snug">
              {weakest ? (
                <>
                  취약 유형이 보입니다 — <em className="font-serif not-italic text-evergreen">{weakest.label}</em>
                </>
              ) : (
                <>오늘의 학습 추천</>
              )}
            </h2>
            <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">
              {weakest
                ? `${weakest.label} 영역을 집중 학습하시면 학습 진척도를 더 빠르게 올릴 수 있습니다.`
                : "풀이·키워드·오답 트랙을 시작하면 AI 가 취약 영역을 분석해 드립니다."}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              ※ 본인의 학습 이력에서 집계한 추천입니다. 학습 결정 시 참고로
              활용해 주세요.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Button asChild size="sm" className="h-8 px-4 text-xs">
            <Link href="/study/quiz">추천 풀이 시작</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
