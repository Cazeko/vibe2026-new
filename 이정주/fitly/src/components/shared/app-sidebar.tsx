"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  FolderOpen,
  ScrollText,
  LineChart,
  AlertCircle,
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

// 헌법 v1.9 제13조 — 사이드바 메인 7
const MAIN: Item[] = [
  { href: "/dashboard", label: "대시보드", Icon: LayoutDashboard },
  { href: "/study-plan", label: "학습 플랜", Icon: ClipboardList },
  { href: "/materials", label: "자료 관리", Icon: FolderOpen },
  { href: "/exam-analysis", label: "기출 분석", Icon: ScrollText },
  { href: "/study-analysis", label: "학습 분석", Icon: LineChart },
  { href: "/mistakes", label: "오답 노트", Icon: AlertCircle },
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
      className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col bg-[#1a1f2e] text-slate-200"
    >
      <div className="px-6 pt-7 pb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white"
          aria-label="Fitly 대시보드"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl gauge-gradient text-sm font-extrabold">
            F
          </span>
          <span>Fitly</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {MAIN.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/5 px-3 py-4 space-y-1">
        <Link
          href="/settings"
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
            pathname.startsWith("/settings")
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings className="h-4 w-4" aria-hidden />
          <span>설정</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
