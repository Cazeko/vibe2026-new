"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  ScrollText,
  LineChart,
  UserCircle,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Item = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

// 헌법 v3.0 제13조 / v3.0.1 — 사이드바 Phase 1 (자료/오답은 cut/Phase2)
const MAIN: Item[] = [
  { href: "/dashboard", label: "대시보드", Icon: LayoutDashboard },
  { href: "/study-plan", label: "학습 계획", Icon: ClipboardList },
  { href: "/exam-analysis", label: "기출 분석", Icon: ScrollText },
  { href: "/study-analysis", label: "학습 분석", Icon: LineChart },
  { href: "/me", label: "마이 페이지", Icon: UserCircle },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside
      aria-label="주 메뉴"
      className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-56 flex-col bg-sidebar text-sidebar-foreground border-r border-rule"
    >
      <div className="px-5 pt-6 pb-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-serif text-2xl font-medium tracking-tight text-foreground"
          aria-label="Fitly 대시보드"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-evergreen text-primary-foreground font-serif italic font-medium">
            F
          </span>
          <span>
            Fitly<span className="text-evergreen">.</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
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
                    "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-evergreen/10 text-evergreen"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-rule px-3 py-3 space-y-0.5">
        <Link
          href="/settings"
          prefetch={false}
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] transition-colors",
            pathname.startsWith("/settings")
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" aria-hidden />
          <span>설정</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
