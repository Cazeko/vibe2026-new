"use client";

import { usePathname } from "next/navigation";

/**
 * P2-02 (외부 리뷰 2026-05-12) — SPA 페이지 트랜지션.
 *
 * Next.js App Router 는 이미 client navigation 으로 페이지 전환 시 전체
 * 리로드는 발생하지 않는다. 다만 시각 어포던스가 부족하여 "페이지가 바뀌었다"
 * 인지가 늦다. 라우트 변경 시 key 갱신 → 자식 mount 재발동 → fade-up 진입
 * 애니메이션 (DESIGN §7.1 진입 200ms ease-out 정합).
 *
 * 본 컴포넌트는 RSC 트리 안에서 children 을 그대로 통과시키므로 SSR/streaming
 * 영향 없음. prefers-reduced-motion 은 tailwind animate plugin 정합.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-fade-up motion-reduce:animate-none">
      {children}
    </div>
  );
}
