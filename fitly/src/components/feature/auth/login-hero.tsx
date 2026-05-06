"use client";

// hero 컨테이너 — viewport·prefers-reduced-motion 분기 후 three.js scene
// 또는 정적 fallback 노출. session storage 가드는 의도적으로 제거 — 첫 인상이
// 보장되어야 'a 진행' 합의의 가치가 있다 (login ↔ signup 전환 시 재생되는
// 약간의 산만은 메모러블 모먼트의 가치보다 작다).

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { StaticHeroFallback } from "./static-hero-fallback";

const PenWritingCanvas = dynamic(
  () => import("./pen-writing-canvas").then((m) => m.PenWritingCanvas),
  { ssr: false, loading: () => <StaticHeroFallback /> },
);

export function LoginHero() {
  const [mode, setMode] = useState<"loading" | "canvas" | "static">("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 모바일·reduced-motion 사용자: 정적 fallback
    const isMobile = window.innerWidth < 768;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (isMobile || reducedMotion) {
      setMode("static");
      return;
    }

    setMode("canvas");
  }, []);

  return (
    <div
      className="relative w-full h-full min-h-[30vh] lg:min-h-screen overflow-hidden"
      aria-hidden="true"
    >
      {mode === "static" || mode === "loading" ? (
        <StaticHeroFallback />
      ) : (
        <PenWritingCanvas />
      )}
    </div>
  );
}
