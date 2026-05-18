"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  ScrollText,
  Pencil,
  GraduationCap,
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
import { useProfile } from "@/components/shared/profile-provider";

type Item = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

// 헌법 §13 (laws/12) Phase 1 7+1 정합: 풀이(/study/quiz) + 학습(/study) 추가.
// 학습 분석(/study-analysis)은 Phase 2이지만 운영 중이라 유지
// (별도 헌법 §13 부분 도입 발의 — docs/proposals/v3.7-sidebar-phase2-partial.md).
const MAIN: Item[] = [
  { href: "/dashboard", label: "대시보드", Icon: LayoutDashboard },
  { href: "/exam-analysis", label: "기출 분석", Icon: ScrollText },
  { href: "/study/quiz", label: "풀이", Icon: Pencil },
  { href: "/study", label: "학습", Icon: GraduationCap },
  { href: "/podcast", label: "팟캐스트", Icon: Headphones },
  { href: "/study-plan", label: "학습 계획", Icon: ClipboardList },
  { href: "/study-analysis", label: "학습 분석", Icon: LineChart },
  { href: "/me", label: "마이 페이지", Icon: UserCircle },
];

// 2026-05-18 hotfix — longest-prefix-match. 종전 단순 startsWith 는
// /study/quiz 진입 시 /study 도 active 로 잡혀 두 nav 가 동시에 초록색이 되던
// 회귀. 더 구체적인(긴) prefix 가 매칭되면 짧은 prefix 는 inactive 로 처리.
function isNavActive(href: string, pathname: string, all: Item[]): boolean {
  const matches =
    pathname === href || pathname.startsWith(`${href}/`);
  if (!matches) return false;
  // 더 긴 prefix 가 같은 pathname 을 매칭하면 본 item 양보.
  for (const other of all) {
    if (other.href === href) continue;
    if (other.href.length <= href.length) continue;
    if (
      pathname === other.href ||
      pathname.startsWith(`${other.href}/`)
    ) {
      return false;
    }
  }
  return true;
}

// 사이드바 협소 공간(188px) 한정 D-N 표기 — 주인님 2026-05-18 명시 발화.
// 헌법 §31 본문은 그대로 유지 (다른 페이지 KPI/학습계획/마이는 "시험까지 N일"
// 직설 표현 유지). 사이드바 chip 은 좁은 폭에서 시각 위계 확보를 위해 운영
// 예외로 D-N 짧은 표기 허용. en-dash(D−) 가 아닌 일반 하이픈(D-) 사용.
function dDayShortLabel(examDate: string | null): string | null {
  if (!examDate) return null;
  const t = new Date(examDate);
  if (Number.isNaN(t.getTime())) return null;
  const now = new Date();
  const a = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((a - b) / 86_400_000);
  if (days > 0) return `D-${days}`;
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
  // 코드리뷰 B.H5 (2026-05-15 PR-10) — Supabase 클라이언트 lazy init 일관성.
  // handleLogout 에서 createClient() 매 클릭 호출하던 패턴을 FitlySignIn 정합.
  const [supabase] = useState(() => createClient());

  // 코드리뷰 B.H2/H3 (2026-05-15 PR-8) — (main)/layout.tsx 가 SSR 1회 조회한
  // profile 을 context 로 받아 사용. 종전 useEffect mount fetch 제거.
  const profile = useProfile();
  const target = {
    region: profile?.targetRegion ?? null,
    examDate: profile?.examDate ?? null,
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsLg(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // v3.5.3 — 라우트 변경 시 모바일 drawer 자동 닫기. lg+ 데스크탑은 본인 선택
  // 보존 (collapsed 유지). 리뷰 H4 fix — mount 첫 회는 skip (race 회피).
  useEffect(() => {
    if (firstPathRef.current) {
      firstPathRef.current = false;
      return;
    }
    if (isLg) return;
    setOpen(false);
  }, [pathname, setOpen, isLg]);

  // v3.5.3 — drawer 열린 상태에서 body 스크롤 잠금 (모바일 한정).
  // v3.5.2 (2026-05-14) — 데스크탑(lg+) 사이드바는 본문과 공존하므로 스크롤
  // 잠금 X. isLg=false + open=true 시에만 잠금 적용.
  // 리뷰 H3 fix — 진입 시 prev overflow 캡처 → cleanup 시 복원.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!open || isLg) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isLg]);

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
    // 주인님 보고 #22 (2026-05-14) — 로그아웃 시 사이드바 collapsed 상태를
    // localStorage 에서 초기화. 재로그인 시 닫힌 채로 시작하지 않도록 보장.
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("fitly:sidebar-open");
      // 코드리뷰 L10 (2026-05-15) — 다른 탭에 로그아웃 신호 brodacast.
      // 동일 origin 의 다른 탭에서 storage 이벤트 listener 가 /login 으로 이동.
      window.localStorage.setItem("fitly:logout-broadcast", String(Date.now()));
      window.localStorage.removeItem("fitly:logout-broadcast");
    }
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  // 코드리뷰 L10 (2026-05-15) — 다른 탭의 로그아웃 broadcast 수신 → 본 탭도
  // /login 으로 이동. 동일 사용자 다중 탭 일관성 보장.
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onStorage(e: StorageEvent) {
      if (e.key === "fitly:logout-broadcast" && e.newValue) {
        router.replace("/login");
        router.refresh();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  const dDayShort = dDayShortLabel(target.examDate);
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

      {/* v3.5.2 (2026-05-14) — 모든 디바이스에서 collapsible. lg+ 도 close 시
          -translate-x-full 로 hide, main padding-left 가 CSS 변수로 동기화.
          aria-modal 은 모바일(drawer) 에서만 적용 (lg+ 는 dialog 패턴 X). */}
      <aside
        aria-label="주 메뉴"
        role={isLg ? undefined : "dialog"}
        aria-modal={!isLg && open ? "true" : undefined}
        aria-hidden={!open ? "true" : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[188px] flex flex-col bg-cream-deep text-foreground border-r border-rule transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
      {/* ─ 브랜드 + 모바일 닫기 버튼 ─
          2026-05-15 — lg+ min-h-[96px] 로 PageHeader 와 동일 높이 유지.
          가로선이 페이지 헤더 가로선과 일자 정렬, 로고는 flex items-center
          로 박스 정중앙 위치 (사용자 보고 2026-05-15). 모바일은 종전 padding 보존. */}
      <div className="px-5 pt-6 pb-5 lg:min-h-[96px] border-b border-rule flex items-center justify-between">
        <Link href="/dashboard" aria-label="Fitly 대시보드">
          <FitlyLogo size="md" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="메뉴 닫기"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
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
            const active = isNavActive(href, pathname, MAIN);
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
                      ? "bg-evergreen text-primary-foreground dark:bg-evergreen-strong dark:shadow-[0_1px_0_0_hsl(var(--color-gold)/0.18)_inset]"
                      : // 2026-05-16 — 다크 모드 inactive 글자 회귀 fix.
                        // 종전 `dark:text-cream/85` 는 cream 토큰이 다크에서
                        // `--color-bg`(거의 검정) 으로 매핑되어 사이드바 cream-deep
                        // 배경 위에 가시성 0. `dark:text-foreground` 로 대시보드
                        // "안녕하세요" 글자 색과 동일하게 정합 (사용자 보고).
                        "text-ink-2 hover:bg-evergreen/[0.06] dark:text-foreground dark:hover:bg-evergreen/[0.10]"
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

        {/* ─ 시험 카운트다운 칩 ─
            주인님 발화 (2026-05-18) — 좁은 188px 사이드바 한정 형식:
            1행: 지역 + 시험일 (가벼움, 부가 정보)
            2행: D-N (강조, 메인 카운트다운)
            §31 운영 예외 (사이드바 한정) — 다른 페이지는 "시험까지 N일" 유지. */}
        {(target.region || examDateLabel || dDayShort) && (
          <div className="mt-4 mx-3 rounded-md bg-secondary/60 px-2.5 py-1.5">
            {(target.region || examDateLabel) && (
              <div className="flex items-baseline gap-1.5">
                {target.region && (
                  <span className="text-[11px] text-muted-foreground truncate leading-none">
                    {target.region}
                  </span>
                )}
                {examDateLabel && (
                  <span className="ml-auto text-[11px] text-muted-foreground tabular-nums leading-none">
                    {examDateLabel}
                  </span>
                )}
              </div>
            )}
            {dDayShort && (
              <p
                className={cn(
                  "tabular-nums tracking-tight font-bold text-foreground leading-none",
                  target.region || examDateLabel
                    ? "mt-1.5 text-[15px]"
                    : "text-[15px]",
                )}
              >
                {dDayShort}
              </p>
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
