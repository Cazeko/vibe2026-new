"use client";

// 헌법 v3.0 제15조 — 프로필 Context Provider (코드리뷰 B.H2/H3 정합, PR-8 2026-05-15).
// (main)/layout.tsx 에서 `getCurrentUserProfile()` 로 SSR 1회 조회한 결과를
// 모든 client 자식이 본 context 로 공유. 종전 페이지당 2~3회 중복 fetch 차단.

import { createContext, useContext, type ReactNode } from "react";
import type { CurrentUserProfile } from "@/lib/user/profile";

const ProfileContext = createContext<CurrentUserProfile | null>(null);

export function ProfileProvider({
  profile,
  children,
}: {
  profile: CurrentUserProfile | null;
  children: ReactNode;
}) {
  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
}

// 인증된 (main) 영역에서는 profile 이 non-null 보장 — middleware 가드 정합.
// 그러나 SSR 일시 장애 등으로 null 일 가능성도 있으므로 nullable 반환.
export function useProfile(): CurrentUserProfile | null {
  return useContext(ProfileContext);
}
