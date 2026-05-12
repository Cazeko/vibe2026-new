"use client";

import { Menu } from "lucide-react";
import { useMobileMenu } from "./mobile-menu-provider";

/**
 * v3.5.3 헌법 §2 — 모바일 햄버거 버튼. lg+ 에서는 숨김.
 * DESIGN §10.1 — Mobile <768 + Tablet 세로 768~1023 에서 노출.
 * WCAG 2.5.5 — hitbox 40×40 (h-10 w-10), aria-label, focus-visible ring.
 */
export function MobileMenuButton() {
  const { setOpen } = useMobileMenu();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="메뉴 열기"
      className="lg:hidden inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-rule bg-cream-soft hover:bg-secondary/40 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
    >
      <Menu className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );
}
