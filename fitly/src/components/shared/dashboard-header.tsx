"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Play } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { MobileMenuButton } from "@/components/shared/mobile-menu-button";

type Profile = {
  displayName: string | null;
  targetRegion: string | null;
};

export function DashboardHeader() {
  const [profile, setProfile] = useState<Profile>({
    displayName: null,
    targetRegion: null,
  });
  // P0-11 (외부 평가 2026-05-12) — client-side fetch 로딩 상태. 인사말이
  // null → 실제 이름으로 깜빡이지 않도록 fetch 동안 스켈레톤 노출.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile({
            displayName: d.profile.displayName ?? null,
            targetRegion: d.profile.targetUniversity ?? null,
          });
        }
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  // 호칭 정책 (2026-05-12 사용자 명시 결정) — UI 학습자 호칭은 "{이름} 선생님"
  // 으로 고정. 헌법 제0조의 "주인님"은 Claude↔주관자 대화 호칭이며, UI 학습자
  // 호칭과는 분리 사안 (제38조 7항 사용자 즉시 발화 우선).
  const greetingName = profile.displayName ?? null;
  const initial = (greetingName ?? "선").trim().charAt(0) || "선";

  // D-17 (외부 리뷰 2026-05-12, DESIGN §9.1 v3.5.3 동기부여 카피 단서) —
  // 펀치라인 "적합도" 톤 유지하면서 학습 의지 환기. 강제·재촉 표현은 회피.
  const subtitle = profile.targetRegion
    ? `${profile.targetRegion} 시험까지, 오늘의 적합도 한 점 함께 짚어 드릴게요.`
    : "오늘의 풀이·키워드·오답이 자동으로 채워집니다. 한 점씩, 함께 가요.";

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 sm:gap-4 border-b border-rule bg-cream/95 backdrop-blur px-4 sm:px-6 lg:px-10 py-4 lg:py-[22px] mb-4 lg:mb-5 xl:mb-0">
      <MobileMenuButton />
      <div className="min-w-0">
        <h1 className="font-sans text-[22px] font-bold tracking-[-0.025em] leading-tight">
          {loaded ? (
            <>
              안녕하세요,{" "}
              {greetingName ? (
                <>
                  <em className="not-italic font-extrabold text-evergreen px-[0.02em]">
                    {greetingName}
                  </em>{" "}
                  선생님.
                </>
              ) : (
                <em className="not-italic font-extrabold text-evergreen px-[0.02em]">
                  선생님.
                </em>
              )}
            </>
          ) : (
            <>
              안녕하세요,{" "}
              <span
                className="skeleton inline-block h-[1.1em] w-32 rounded-md align-[-0.15em]"
                aria-label="이름 로딩 중"
              />
            </>
          )}
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground leading-[1.5]">
          {subtitle}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        {/* v3.6 외부 평가 #2.4 — 핵심 CTA 펄스 강조. §7 모션 절제는
            globals.css 의 fitly-pulse 가 prefers-reduced-motion 정합으로 비활성. */}
        <Link
          href="/study/quiz"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-evergreen px-4 text-[13.5px] font-semibold text-white hover:bg-evergreen-strong transition-colors fitly-pulse"
        >
          <Play className="h-3.5 w-3.5 text-gold" aria-hidden />
          <span>오늘 학습 시작</span>
        </Link>
        {/* 사용자 보고 2026-05-12 — 종 모양 알림 클릭 무반응. 헌법 제16조 스코프
            보호로 알림 기능 신규 도입은 별도 작업. 현 단계는 "준비 중" 안내. */}
        <button
          type="button"
          aria-label="알림 (준비 중)"
          title="알림 기능은 준비 중입니다."
          aria-disabled="true"
          disabled
          className="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-transparent text-muted2-deep/60 cursor-not-allowed"
        >
          {/* v3.5.6 외부 리뷰 #2.7 — stroke 두께 1.8 → 2.0 으로 한 단계 증강.
              종전 1.8 은 cream/95 배경 위에서 여전히 가는 인상. 2.0 으로 라인
              두께 균일화하여 ThemeToggle 의 Sun/Moon (default 2) 과 시각 정합. */}
          <Bell className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
        <ThemeToggle />
        <Link
          href="/me"
          aria-label="마이 페이지"
          className="grid h-[38px] w-[38px] place-items-center rounded-full bg-evergreen text-gold font-bold text-[14px] border border-black/[0.04]"
        >
          {initial}
        </Link>
      </div>
    </header>
  );
}
