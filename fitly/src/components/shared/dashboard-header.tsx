"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Play } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

type Profile = {
  displayName: string | null;
  targetRegion: string | null;
};

export function DashboardHeader() {
  const [profile, setProfile] = useState<Profile>({
    displayName: null,
    targetRegion: null,
  });

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
      .catch(() => undefined);
  }, []);

  const greetingName = profile.displayName ?? "주인";
  const initial = (greetingName ?? "주").trim().charAt(0) || "주";
  const subtitle = profile.targetRegion
    ? `${profile.targetRegion} 시험 대비 일정과 학습 진척을 정리해 드릴게요.`
    : "오늘의 풀이·키워드·오답 트랙이 자동으로 채워지고, 추천 팟캐스트가 생성됩니다.";

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-4 border-b border-rule bg-cream/95 backdrop-blur px-10 py-[22px]">
      <div className="min-w-0">
        <h1 className="font-sans text-[22px] font-bold tracking-[-0.025em] leading-tight">
          안녕하세요, <em className="not-italic font-extrabold text-evergreen px-[0.02em]">{greetingName}</em>님.
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground leading-[1.5]">
          {subtitle}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <Link
          href="/study/quiz"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-evergreen px-4 text-[13.5px] font-semibold text-white hover:bg-evergreen-strong transition-colors"
        >
          <Play className="h-3.5 w-3.5 text-gold" aria-hidden />
          <span>오늘 학습 시작</span>
        </Link>
        <button
          type="button"
          aria-label="알림"
          className="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-transparent text-muted2-deep hover:bg-cream-soft hover:border-rule transition-colors"
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden />
          <span
            aria-hidden
            className="absolute top-[9px] right-[10px] h-1.5 w-1.5 rounded-full bg-error ring-[1.5px] ring-cream"
          />
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
