import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { WeakType } from "@/lib/dashboard/types";

export function AiRecommend({ weakest }: { weakest: WeakType | null }) {
  // viewport fit (lg+) — compact padding + flex-col 로 buttons 하단 정착.
  // 사용자 보고 2026-05-12 — 카드 대비 여백 과다 → 전반 축소 (F 배지·헤더·본문·footer).
  return (
    // v3.6 외부 평가 #2.13 — AI 추천 카드 그라데이션 보더 (gold→evergreen 옅게).
    // §4.3 evergreen 6 사용처 내 — AI 추천은 evergreen 인정 위치, gradient-border
    // 클래스가 *보더만* 색을 입혀 본문/배경은 cream-soft 그대로.
    <article className="rounded-card gradient-border bg-cream-soft px-4 pt-3.5 pb-3 h-full flex flex-col">
      {/* 헤더 — F 배지 + eyebrow + 제목 (컴팩트) */}
      <div className="flex items-center gap-2.5 mb-2 shrink-0">
        <span
          aria-hidden
          className="grid h-7 w-7 place-items-center rounded-[7px] bg-evergreen text-gold font-extrabold text-[13px] tracking-[-0.02em] shrink-0"
        >
          F
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.22em] text-muted-foreground">
            FITLY · AI 추천
          </p>
          <h3 className="mt-0.5 font-sans text-[15px] font-bold tracking-[-0.02em] text-foreground leading-tight truncate">
            {weakest ? (
              <>
                취약 유형 —{" "}
                <em className="not-italic text-evergreen">{weakest.label}</em>
              </>
            ) : (
              <>오늘의 학습 추천</>
            )}
          </h3>
        </div>
      </div>

      <p className="text-[12.5px] leading-[1.55] tracking-[-0.005em] text-muted2-deep mb-2.5 flex-1 min-h-0">
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

      <p className="text-[10.5px] leading-[1.45] text-muted-foreground border-t border-rule pt-2 mb-2.5 shrink-0">
        ※ 본인의 학습 이력 기반 추천. 참고로만 활용해 주세요.
      </p>

      <div className="flex gap-1.5 flex-wrap shrink-0">
        {/* v3.6 외부 평가 #2.4 — AI 추천 메인 CTA 에 fitly-pulse (1.6s ease-out).
            §7 모션 절제 정합 — prefers-reduced-motion 시 자동 비활성 (globals.css).
            펄스는 시각 강조 1회성이라 §4.3 evergreen 6 사용처 보호 정합. */}
        <Link
          href="/study/quiz"
          className="inline-flex h-[34px] items-center gap-1.5 rounded-md bg-evergreen px-3 text-[12.5px] font-semibold text-white hover:bg-evergreen-strong transition-colors fitly-pulse"
        >
          추천 풀이 시작
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
        <Link
          href="/study-analysis"
          className="inline-flex h-[34px] items-center rounded-md border border-rule-strong px-3 text-[12.5px] font-semibold text-muted2-deep hover:border-evergreen hover:text-evergreen transition-colors"
        >
          분석 방법
        </Link>
      </div>
    </article>
  );
}
