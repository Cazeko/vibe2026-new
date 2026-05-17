"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, X } from "lucide-react";

// 2026-05-18 (주인님 발화) — 첫 대시보드 진입 시 노출되는 안내 카드. X 닫기 버튼
// 으로 영구 dismiss 가능. localStorage 키에 user.id 포함 → **계정별** dismiss 상태
// 보존. 같은 브라우저에서 새 계정 로그인 시 안내 카드가 다시 노출된다 (테스트
// 시나리오 정합).
//
// 2026-05-18 (주인님 발화 v2) — 종전 글로벌 키 `fitly:onboarding-dismissed` 는
// 한 계정에서 닫으면 다른 새 계정에서도 안 뜨던 회귀. user.id 별로 분리.
function dismissKeyFor(userId: string): string {
  return `fitly:onboarding-dismissed:${userId}`;
}

export function OnboardingBanner({
  isEmpty,
  userId,
}: {
  isEmpty: boolean;
  userId: string;
}) {
  // SSR 시점: 일단 noscript 폴백 위해 dismissed=false (콘텐츠 있는 사용자에게
  // 보였다가 안 보이는 깜빡임을 피하려면 isEmpty 게이트가 우선). client mount
  // 후 localStorage 확인하여 setDismissed.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(dismissKeyFor(userId)) === "1") {
      setDismissed(true);
    }
  }, [userId]);

  function handleDismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(dismissKeyFor(userId), "1");
    }
    setDismissed(true);
  }

  if (!isEmpty || dismissed) return null;

  return (
    <article className="relative rounded-card border-l-[3px] border-l-evergreen border-y border-r border-rule bg-cream-soft px-5 py-4 pr-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-full bg-evergreen text-gold shrink-0"
        >
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="font-sans text-[15px] font-bold tracking-[-0.02em]">
            Fitly 첫 방문을 환영합니다.
          </p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            아래 단계만 완료하시면 학습 진척도와 추이가 실시간으로 그려집니다.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="inline-flex h-9 items-center rounded-lg border border-rule-strong px-3 text-[12.5px] font-semibold text-muted2-deep hover:border-evergreen hover:text-evergreen transition-colors"
        >
          1) 시험일 등록
        </Link>
        <Link
          href="/exam-analysis"
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-evergreen px-3 text-[12.5px] font-semibold text-primary-foreground hover:bg-evergreen-strong transition-colors"
        >
          2) 기출 분석 시작
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="안내 카드 닫기"
        title="닫기 (다시 표시되지 않습니다)"
        className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-rule/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </article>
  );
}
