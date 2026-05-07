"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BookOpen, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
            // v3.0 — targetUniversity 컬럼은 region 라벨로 임시 재해석 (D-S2에서 컬럼 명칭 재정렬).
            targetRegion: d.profile.targetUniversity ?? null,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  // 헌법 v3.0 — 시연 페르소나 라벨. 지역 교육청은 선택 입력 (제15조).
  const greetingName = profile.displayName ?? "주인";
  const subtitle = profile.targetRegion
    ? `${profile.targetRegion} 시험 합격까지, Fitly 가 일정과 진척을 정리해 드릴게요.`
    : "오늘의 풀이·키워드·오답 트랙이 자동으로 채워지고, 추천 팟캐스트가 생성됩니다.";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-3">
      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
          안녕하세요, {greetingName}님.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <Button asChild className="h-9 rounded-lg px-3 text-sm">
          <Link href="/study/quiz">
            <BookOpen className="h-4 w-4" aria-hidden />
            오늘 학습 시작
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="알림"
          className="h-9 w-9 rounded-full"
        >
          <Bell className="h-4 w-4" aria-hidden />
        </Button>
        <ThemeToggle />
        <Link
          href="/me"
          aria-label="마이 페이지"
          className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <UserCircle className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
