"use client";

import { Menu } from "lucide-react";
import { useMobileMenu } from "./mobile-menu-provider";

/**
 * v3.5.3 헌법 §2 — 모바일 햄버거 버튼.
 * v3.5.2 (2026-05-14) — 데스크탑 토글 통합. open=true 시에는 자기 자신 숨김
 *   (사이드바 X 버튼이 close 역할). open=false 일 때만 노출되어 reopen 트리거.
 * WCAG 2.5.5 — hitbox 40×40 (h-10 w-10), aria-label, focus-visible ring.
 */
export function MobileMenuButton() {
  const { open, setOpen } = useMobileMenu();
  if (open) return null;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="메뉴 열기"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-rule bg-cream-soft hover:bg-secondary/40 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
    >
      <Menu className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );
}
