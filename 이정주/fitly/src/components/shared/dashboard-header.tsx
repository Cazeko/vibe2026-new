"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Plus, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Profile = {
  displayName: string | null;
  targetUniversity: string | null;
};

export function DashboardHeader() {
  const [profile, setProfile] = useState<Profile>({
    displayName: null,
    targetUniversity: null,
  });

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile({
            displayName: d.profile.displayName ?? null,
            targetUniversity: d.profile.targetUniversity ?? null,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  // 헌법 v1.9 시연 페르소나 라벨 — 프로필 미설정 시 가상 사용자임을 명시.
  const greetingName = profile.displayName ?? "주인";
  const subtitle = profile.targetUniversity
    ? `목표 ${profile.targetUniversity} 합격까지, Fitly가 함께할게요.`
    : "목표 학교를 설정하고 첫 Fit 점수를 받아보세요.";

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-8 pt-8 pb-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          안녕하세요, {greetingName}님!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="default" className="rounded-xl">
          <Link href="/materials">
            <Plus className="h-4 w-4" aria-hidden />
            자료 업로드
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="알림"
          className="rounded-full"
        >
          <Bell className="h-5 w-5" aria-hidden />
        </Button>
        <Link
          href="/me"
          aria-label="마이 페이지"
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-foreground"
        >
          <UserCircle className="h-6 w-6" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
