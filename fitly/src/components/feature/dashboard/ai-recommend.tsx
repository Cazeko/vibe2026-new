import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { WeakType } from "@/lib/dashboard/types";

export function AiRecommend({ weakest }: { weakest: WeakType | null }) {
  return (
    <article className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5 h-full">
      {/* 헤더 — F 배지 + eyebrow + 제목 */}
      <div className="flex items-center gap-3 mb-3">
        <span
          aria-hidden
          className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-evergreen text-gold font-extrabold text-[15px] tracking-[-0.02em]"
        >
          F
        </span>
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
            FITLY · AI 추천
          </p>
          <h3 className="mt-1 font-sans text-[17px] font-bold tracking-[-0.02em] text-foreground leading-tight">
            {weakest ? (
              <>
                취약 유형이 보입니다 —{" "}
                <em className="not-italic text-evergreen">{weakest.label}</em>
              </>
            ) : (
              <>오늘의 학습 추천</>
            )}
          </h3>
        </div>
      </div>

      <p className="text-[13.5px] leading-[1.65] tracking-[-0.01em] text-muted2-deep mb-3.5">
        {weakest ? (
          <>
            <strong className="font-bold text-foreground">{weakest.label}</strong>{" "}
            영역을 집중 학습하시면 학습 진척도를 더 빠르게 올릴 수 있습니다.
          </>
        ) : (
          <>
            풀이·키워드·오답 트랙을 시작하면{" "}
            <strong className="font-bold text-foreground">
              AI가 취약 영역
            </strong>
            을 분석해 드립니다. 누적 데이터가 쌓일수록 추천 정확도가 올라갑니다.
          </>
        )}
      </p>

      <p className="text-[11.5px] leading-[1.55] text-muted-foreground border-t border-rule pt-3 mb-4">
        ※ 본인의 학습 이력에서 집계한 추천입니다. 학습 결정 시 참고로 활용해
        주세요.
      </p>

      <div className="flex gap-2 flex-wrap">
        <Link
          href="/study/quiz"
          className="inline-flex h-[38px] items-center gap-2 rounded-lg bg-evergreen px-4 text-[13px] font-semibold text-white hover:bg-evergreen-strong transition-colors"
        >
          추천 풀이 시작
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
        <Link
          href="/study-analysis"
          className="inline-flex h-[38px] items-center rounded-lg border border-rule-strong px-4 text-[13px] font-semibold text-muted2-deep hover:border-evergreen hover:text-evergreen transition-colors"
        >
          분석 방법 살펴보기
        </Link>
      </div>
    </article>
  );
}
