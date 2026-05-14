"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * v3.5.3 헌법 §2 — 모바일 1차 지원 정합.
 * v3.5.2 (2026-05-14) — 데스크탑(lg+) 토글 통합. open 상태는 양 디바이스에서
 *   사이드바 visibility 의미를 공유한다. 모바일은 drawer, 데스크탑은 collapsible.
 *
 * 데스크탑 collapsed 시 html[data-sidebar="closed"] 가 부여되어 main 의
 * padding-left 가 --sidebar-w=0px 로 줄어든다 (globals.css 정합).
 *
 * 영속화 — localStorage `fitly:sidebar-open` 으로 데스크탑 collapsed 상태 보존.
 */
type Ctx = { open: boolean; setOpen: (v: boolean) => void };

const MobileMenuContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "fitly:sidebar-open";

export function MobileMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 초기값 — SSR 정합 위해 true (데스크탑 기본 visible).
  // 모바일은 mount 후 첫 effect 에서 close 되며, 데스크탑은 localStorage hydrate.
  const [open, setOpen] = useState(true);

  // 마운트 시 디바이스 측정 + localStorage hydrate.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isLg = window.matchMedia("(min-width: 1024px)").matches;
    if (isLg) {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "0") setOpen(false);
    } else {
      setOpen(false);
    }
  }, []);

  // 데스크탑 collapsed 상태 → html[data-sidebar] 동기화 + localStorage 보존.
  // 모바일은 drawer 형태라 main pl 영향 없음 — 다만 동일 변수로 통합하여 단순화.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const isLg = window.matchMedia("(min-width: 1024px)").matches;
    document.documentElement.dataset.sidebar = open ? "open" : "closed";
    if (isLg) {
      window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    }
  }, [open]);

  return (
    <MobileMenuContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu(): Ctx {
  const ctx = useContext(MobileMenuContext);
  if (!ctx)
    throw new Error("useMobileMenu must be used within MobileMenuProvider");
  return ctx;
}
