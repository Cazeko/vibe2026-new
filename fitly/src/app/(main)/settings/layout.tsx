import type { Metadata } from "next";
import type { ReactNode } from "react";

// N1 metadata — settings 페이지가 "use client" 인 관계로 layout에서 정의.
// 헌법 §24의2 — 명시 근거: docs/audit/2026-05-12-pages-ux-audit.md 페이지 9 N1.
export const metadata: Metadata = {
  title: "설정 · Fitly",
  description: "지역 교육청·시험일 설정 + 테마·계정 관리",
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
