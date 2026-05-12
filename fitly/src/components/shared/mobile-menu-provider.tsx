"use client";

import { createContext, useContext, useState } from "react";

/**
 * v3.5.3 헌법 §2 — 모바일 1차 지원 정합.
 * AppSidebar 모바일 drawer ↔ 페이지 헤더의 햄버거 버튼 상태 공유 컨텍스트.
 */
type Ctx = { open: boolean; setOpen: (v: boolean) => void };

const MobileMenuContext = createContext<Ctx | null>(null);

export function MobileMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
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
