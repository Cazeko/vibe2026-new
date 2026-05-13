"use client";

import { useEffect, useRef, useState } from "react";
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
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FitlyLogo } from "@/components/shared/fitly-logo";
import { useMobileMenu } from "@/components/shared/mobile-menu-provider";

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
  const { open, setOpen } = useMobileMenu();
  const firstPathRef = useRef(true);
  // 리뷰 H2 fix — lg+ 데스크톱 임계점 클라이언트 측정.
  // SSR hydration mismatch 회피 위해 초기값 false, mount 후 정합.
  const [isLg, setIsLg] = useState(false);
  const [target, setTarget] = useState<{
    region: string | null;
    examDate: string | null;
  }>({ region: null, examDate: null });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsLg(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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

  // v3.5.3 — 라우트 변경 시 모바일 drawer 자동 닫기.
  // 리뷰 H4 fix — mount 첫 회는 skip (race 회피).
  useEffect(() => {
    if (firstPathRef.current) {
      firstPathRef.current = false;
      return;
    }
    setOpen(false);
  }, [pathname, setOpen]);

  // v3.5.3 — drawer 열린 상태에서 body 스크롤 잠금 (모바일 한정).
  // 리뷰 H3 fix — 진입 시 prev overflow 캡처 → cleanup 시 복원 (다른 모달
  // (shadcn Dialog 등)의 lock 을 빈 문자열로 덮어쓰는 회귀 방지).
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 리뷰 H1 fix — Esc 키로 drawer 닫기 (WAI-ARIA dialog 패턴).
  useEffect(() => {
    if (!open) return;
    if (typeof document === "undefined") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  async function handleLogout() {
    // 리뷰 M6 fix — logout 전 drawer 명시 close (SPA transition 사이 잔존 회피).
    setOpen(false);
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
    <>
      {/* v3.5.3 — 모바일 backdrop. lg+ 에서는 사용 안 함. */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* 리뷰 H2 fix — modal drawer 시멘틱 + 모바일 폐쇄 시 aria-hidden.
          lg+ 데스크톱은 always visible 사이드바라 dialog 시멘틱 X. */}
      <aside
        aria-label="주 메뉴"
        role={isLg ? undefined : "dialog"}
        aria-modal={!isLg && open ? "true" : undefined}
        aria-hidden={!isLg && !open ? "true" : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[248px] flex flex-col bg-cream-deep text-foreground border-r border-rule transition-transform duration-200 ease-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
      {/* ─ 브랜드 + 모바일 닫기 버튼 ─ */}
      <div className="px-5 pt-6 pb-5 border-b border-rule flex items-center justify-between">
        <Link href="/dashboard" aria-label="Fitly 대시보드">
          <FitlyLogo size="md" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="메뉴 닫기"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
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
                    // v3.6 외부 평가 #2.9 — 다크 모드 active 명도 강화.
                    // 다크는 evergreen-strong + shadow (38%→50% 광도) 로 비-active 와 명확 분리.
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium tracking-[-0.01em] transition-colors",
                    active
                      ? "bg-evergreen text-white dark:bg-evergreen-strong dark:shadow-[0_1px_0_0_hsl(var(--color-gold)/0.18)_inset]"
                      : "text-ink-2 hover:bg-evergreen/[0.06] dark:text-cream/85 dark:hover:bg-evergreen/[0.10]"
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
    </>
  );
}
