"use client";

// hero 컨테이너 — viewport·prefers-reduced-motion 분기 후 three.js scene
// 또는 정적 fallback 노출.
//
// next/dynamic으로 PenWritingCanvas를 분리했더니 preview 환경에서 chunk가
// 로드되지 않아 fallback만 노출되는 케이스가 발생 → 직접 import로 변경.
// /login·/signup 페이지의 First Load JS가 ~150KB 증가하지만(three.js 통합),
// (main) app 청크에는 영향 X — 첫 인상 100% 보장이 우선.

import { useEffect, useState } from "react";
import { PenWritingCanvas } from "./pen-writing-canvas";
import { StaticHeroFallback } from "./static-hero-fallback";

export function LoginHero() {
  const [mode, setMode] = useState<"loading" | "canvas" | "static">("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;

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
    <div className="relative w-full h-full min-h-[30vh] lg:min-h-screen overflow-hidden">
      {mode === "static" || mode === "loading" ? (
        <StaticHeroFallback />
      ) : (
        <PenWritingCanvas />
      )}
    </div>
  );
}
