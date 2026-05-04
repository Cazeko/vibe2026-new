"use client";

import { useCallback, useEffect, useRef } from "react";

// 헌법 v1.10 — 학습 세션 추적·로깅 훅.
// 페이지 마운트 시 시작 시각을 잡고, 카운터(answered/correct/cards)를 누적한다.
// finish() 호출 시 /api/study/log 에 한 번 POST한다.

type Mode = "vocab" | "exam" | "review";

export function useStudySession(mode: Mode) {
  const startedRef = useRef(Date.now());
  const sentRef = useRef(false);
  const cardsRef = useRef(0);
  const correctRef = useRef(0);
  const totalRef = useRef(0);

  const recordCard = useCallback((isCorrect: boolean | null) => {
    cardsRef.current += 1;
    if (isCorrect != null) {
      totalRef.current += 1;
      if (isCorrect) correctRef.current += 1;
    }
  }, []);

  const finish = useCallback(async () => {
    if (sentRef.current) return;
    sentRef.current = true;
    const durationSeconds = Math.max(
      0,
      Math.round((Date.now() - startedRef.current) / 1000),
    );
    if (cardsRef.current === 0 && durationSeconds < 5) return;
    try {
      await fetch("/api/study/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          durationSeconds,
          cardsReviewed: cardsRef.current,
          correctCount: correctRef.current,
          totalCount: totalRef.current,
        }),
      });
    } catch {
      // 세션 로깅 실패는 사용자 경험에 영향 주지 않음
    }
  }, [mode]);

  // 페이지 이탈 시 미전송 세션을 best-effort 로 마감
  useEffect(() => {
    const handleUnload = () => {
      void finish();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      void finish();
    };
  }, [finish]);

  return { recordCard, finish };
}
