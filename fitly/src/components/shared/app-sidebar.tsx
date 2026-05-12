"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  ScrollText,
  Headphones,
  LineChart,
  UserCircle,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FitlyLogo } from "@/components/shared/fitly-logo";

type Item = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

const MAIN: Item[] = [
  { href: "/dashboard", label: "대시보드", Icon: LayoutDashboard },
  { href: "/study-plan", label: "학습 계획", Icon: ClipboardList },
  { href: "/exam-analysis", label: "기출 분석", Icon: ScrollText },
  { href: "/podcast", label: "팟캐스트", Icon: Headphones },
  { href: "/study-analysis", label: "학습 분석", Icon: LineChart },
  { href: "/me", label: "마이 페이지", Icon: UserCircle },
];

function dDayLabel(examDate: string | null): string | null {
  if (!examDate) return null;
  const t = new Date(examDate);
  if (Number.isNaN(t.getTime())) return null;
  const now = new Date();
  const a = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((a - b) / 86_400_000);
  if (days > 0) return `D−${days}`;
  if (days === 0) return "D-DAY";
  return `D+${Math.abs(days)}`;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [target, setTarget] = useState<{
    region: string | null;
    examDate: string | null;
  }>({ region: null, examDate: null });

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setTarget({
            region: d.profile.targetUniversity ?? null,
            examDate: d.profile.examDate ?? null,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const dDay = dDayLabel(target.examDate);
  const examDateLabel = target.examDate
    ? new Date(target.examDate).toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <aside
      aria-label="주 메뉴"
      className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[248px] flex-col bg-cream-deep text-foreground border-r border-rule"
    >
      {/* ─ 브랜드 ─ */}
      <div className="px-5 pt-6 pb-5 border-b border-rule">
        <Link href="/dashboard" aria-label="Fitly 대시보드">
          <FitlyLogo size="md" />
        </Link>
      </div>

      {/* ─ MENU 라벨 + 내비 ─ */}
      <nav className="flex-1 overflow-y-auto px-3 pt-5">
        <p className="px-3 pb-2.5 text-[10.5px] font-bold tracking-[0.18em] text-muted-foreground">
          MENU
        </p>
        <ul className="space-y-0.5">
          {MAIN.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  prefetch={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium tracking-[-0.01em] transition-colors",
                    active
                      ? "bg-evergreen text-white"
                      : "text-ink-2 hover:bg-evergreen/[0.06]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[17px] w-[17px] shrink-0",
                      active ? "text-gold" : "text-muted-foreground/80"
                    )}
                    aria-hidden
                  />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ─ D-day 칩 (시험 카운트다운) ─
            P1-07 (외부 리뷰 2026-05-12) — 대시보드 KPI "목표" 카드와 D-day 중복.
            큰 evergreen 박스를 작은 인라인 칩으로 축소하여 정보 밀도 분산.
            P1 코드 리뷰 H1 fix — text-evergreen 은 §4.3 6 사용처 외이므로
            font weight + tabular-nums 로만 강조. 배경도 secondary tint 로 전환. */}
        {dDay && (
          <div className="mt-4 mx-3 flex items-center gap-1.5 rounded-md bg-secondary/60 px-2.5 py-1.5 text-[12px]">
            <span className="font-bold text-foreground tabular-nums tracking-tight">
              {dDay}
            </span>
            {target.region && (
              <span className="text-muted-foreground">
                · {target.region}
              </span>
            )}
            {examDateLabel && (
              <span className="ml-auto text-[10.5px] text-muted-foreground tabular-nums">
                {examDateLabel}
              </span>
            )}
          </div>
        )}
      </nav>

      {/* ─ 푸터 (설정 + 로그아웃) ─ */}
      <div className="border-t border-rule px-3 py-3.5 space-y-0.5">
        <Link
          href="/settings"
          prefetch={false}
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] text-muted2-deep hover:bg-evergreen/[0.06] hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" aria-hidden />
          <span>설정</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] text-muted2-deep hover:bg-evergreen/[0.06] hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
