"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Track 2.1 (v3.5.4) — Intersection Observer 기반 lazy mount wrapper.
//
// children 이 클라이언트에서 무거운 경우 (Recharts ResponsiveContainer 등)
// viewport 진입 전에는 placeholder 만 렌더. 진입 후 children 마운트.
// 한 번 마운트되면 다시 unmount 하지 아니한다 (rootMargin 으로 미리 mount).
//
// rootMargin 기본 200px — 사용자가 스크롤로 영역에 닿기 전 200px 거리에서 마운트
// 시작 → 보일 때는 이미 렌더 완료.

type Props = {
  children: ReactNode;
  /** placeholder 영역 최소 높이 (CLS 방지) */
  minHeight?: string;
  /** Intersection 마진 — 기본 "200px 0px" */
  rootMargin?: string;
  /** SSR 호환 — true 면 첫 렌더부터 mount (prefers-reduced-motion 등). */
  eager?: boolean;
  className?: string;
};

export function LazyMount({
  children,
  minHeight = "240px",
  rootMargin = "200px 0px",
  eager = false,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(eager);

  useEffect(() => {
    if (mounted) return;
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    // SSR 또는 IntersectionObserver 미지원 환경 → 즉시 마운트.
    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [mounted, rootMargin]);

  return (
    <div ref={ref} className={className} style={{ minHeight }}>
      {mounted ? (
        children
      ) : (
        <div
          aria-hidden
          className="h-full w-full grid place-items-center text-[11px] text-muted-foreground/60"
          style={{ minHeight }}
        >
          {/* placeholder — 시각 noise 최소화. screen reader 는 aria-hidden 으로 skip. */}
          <span>…</span>
        </div>
      )}
    </div>
  );
}
