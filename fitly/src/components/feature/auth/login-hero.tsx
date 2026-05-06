"use client";

// hero 컨테이너 — viewport·prefers-reduced-motion·session storage 분기 후
// three.js scene 또는 정적 fallback 노출.

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { StaticHeroFallback } from "./static-hero-fallback";

const PenWritingCanvas = dynamic(
  () => import("./pen-writing-canvas").then((m) => m.PenWritingCanvas),
  { ssr: false, loading: () => <StaticHeroFallback /> },
);

const SESSION_KEY = "fitly:login-hero-played";

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

    // 같은 세션 내 재진입 (login ↔ signup 전환 등): 정적 fallback
    const alreadyPlayed = sessionStorage.getItem(SESSION_KEY) === "true";
    if (alreadyPlayed) {
      setMode("static");
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "true");
    setMode("canvas");
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
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
