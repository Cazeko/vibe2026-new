"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Timer, Play, Pause, RotateCcw, Settings as SettingsIcon } from "lucide-react";

// 백승환 #7 (2026-05-15) — 학습 타이머.
// 모드: countup (경과) | countdown (남은). countdown 분 단위 8/10/12/15/20.
// localStorage:
//   fitly:timer:enabled (1/0)
//   fitly:timer:mode    (countup | countdown)
//   fitly:timer:duration (분, countdown 전용)
// 카드 변경 시 자동 리셋. 재생/일시정지/초기화 버튼.
// prefers-reduced-motion 검출 시 깜빡임 애니메이션 생략 (a11y).

type Mode = "countup" | "countdown";

const STORE_ENABLED = "fitly:timer:enabled";
const STORE_MODE = "fitly:timer:mode";
const STORE_DURATION = "fitly:timer:duration";
const DURATION_OPTIONS = [8, 10, 12, 15, 20] as const;
const DEFAULT_DURATION = 12;

type Props = {
  cardId: string;
};

export function StudyTimer({ cardId }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<Mode>("countup");
  const [duration, setDuration] = useState<number>(DEFAULT_DURATION);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [running, setRunning] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  // localStorage hydrate (마운트 1회).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const e = window.localStorage.getItem(STORE_ENABLED);
    if (e === "1") setEnabled(true);
    const m = window.localStorage.getItem(STORE_MODE);
    if (m === "countdown" || m === "countup") setMode(m);
    const d = Number(window.localStorage.getItem(STORE_DURATION) ?? DEFAULT_DURATION);
    if (DURATION_OPTIONS.includes(d as (typeof DURATION_OPTIONS)[number])) {
      setDuration(d);
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onMq = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  // localStorage persist.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORE_ENABLED, enabled ? "1" : "0");
  }, [enabled]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORE_MODE, mode);
  }, [mode]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORE_DURATION, String(duration));
  }, [duration]);

  // 카드 변경 시 elapsed 리셋 + 자동 재생.
  useEffect(() => {
    setElapsedSec(0);
    setRunning(true);
  }, [cardId]);

  // 1초 tick — running && enabled 일 때만.
  useEffect(() => {
    if (!enabled || !running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, running]);

  // 설정 패널 외부 클릭 시 닫기.
  useEffect(() => {
    if (!showSettings) return;
    function onClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showSettings]);

  const handleReset = useCallback(() => {
    setElapsedSec(0);
    setRunning(true);
  }, []);

  // 표시 시간 계산.
  const displaySec =
    mode === "countdown"
      ? Math.max(0, duration * 60 - elapsedSec)
      : elapsedSec;
  const m = Math.floor(displaySec / 60);
  const s = displaySec % 60;
  const timeStr = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  const isOvertime = mode === "countdown" && elapsedSec > duration * 60;
  const isLowTime = mode === "countdown" && displaySec > 0 && displaySec < 60;
  const isFinished = mode === "countdown" && displaySec === 0 && elapsedSec >= duration * 60;

  // 비활성 상태 — 버튼만 노출.
  if (!enabled) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setEnabled(true)}
          aria-label="타이머 켜기"
          title="타이머 켜기"
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-rule px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
        >
          <Timer className="h-3 w-3" aria-hidden />
          <span>타이머</span>
        </button>
      </div>
    );
  }

  // 활성 상태 — 시간 + 컨트롤.
  return (
    <div className="relative inline-flex items-center gap-1.5" ref={settingsRef}>
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] tabular-nums font-semibold transition-colors ${
          isFinished || isOvertime
            ? `bg-error/10 border-error/40 text-error ${reducedMotion ? "" : "animate-pulse"}`
            : isLowTime
              ? "bg-warning/10 border-warning/40 text-warning-text"
              : "bg-card border-rule text-foreground"
        }`}
        role="timer"
        aria-live="off"
        aria-label={`타이머 — ${mode === "countdown" ? "남은 시간" : "경과 시간"} ${timeStr}`}
      >
        <Timer className="h-3 w-3" aria-hidden />
        <span>{timeStr}</span>
      </div>

      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        aria-label={running ? "일시정지" : "재생"}
        title={running ? "일시정지" : "재생"}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
      >
        {running ? <Pause className="h-3 w-3" aria-hidden /> : <Play className="h-3 w-3" aria-hidden />}
      </button>

      <button
        type="button"
        onClick={handleReset}
        aria-label="초기화"
        title="초기화"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
      >
        <RotateCcw className="h-3 w-3" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => setShowSettings((v) => !v)}
        aria-label="타이머 설정"
        aria-expanded={showSettings}
        title="설정"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
      >
        <SettingsIcon className="h-3 w-3" aria-hidden />
      </button>

      {showSettings && (
        <div
          role="dialog"
          aria-label="타이머 설정"
          className="absolute right-0 top-9 z-30 w-[260px] rounded-md border border-rule bg-card shadow-lg p-3 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold">모드</span>
            <div className="inline-flex rounded-md border border-rule overflow-hidden">
              <button
                type="button"
                onClick={() => setMode("countup")}
                aria-pressed={mode === "countup"}
                className={`px-2.5 py-1 text-[11px] transition-colors ${
                  mode === "countup"
                    ? "bg-evergreen/10 text-evergreen font-semibold"
                    : "text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                경과
              </button>
              <button
                type="button"
                onClick={() => setMode("countdown")}
                aria-pressed={mode === "countdown"}
                className={`px-2.5 py-1 text-[11px] transition-colors ${
                  mode === "countdown"
                    ? "bg-evergreen/10 text-evergreen font-semibold"
                    : "text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                카운트다운
              </button>
            </div>
          </div>

          {mode === "countdown" && (
            <div className="space-y-1.5">
              <span className="text-[11.5px] font-semibold block">
                문항당 시간
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDuration(d);
                      setElapsedSec(0);
                    }}
                    aria-pressed={duration === d}
                    className={`rounded-full border px-2 py-0.5 text-[11px] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 ${
                      duration === d
                        ? "bg-evergreen/10 border-evergreen text-evergreen font-semibold"
                        : "border-rule text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {d}분
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-rule/60 pt-2">
            <button
              type="button"
              onClick={() => {
                setEnabled(false);
                setShowSettings(false);
              }}
              className="text-[11px] text-error hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 rounded"
            >
              타이머 끄기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
