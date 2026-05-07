"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

// 헌법 v3.0 §13의3 4항 — 청취 진척 저장 (재개 가능).
// 5초 throttle로 /api/podcast/progress 호출. 종료 시 completed=true.

type Props = {
  episodeId: string;
  audioUrl: string;
  durationSec: number | null;
  initialCurrentSec: number;
  initialCompleted: boolean;
};

function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function AudioPlayer({
  episodeId,
  audioUrl,
  durationSec,
  initialCurrentSec,
  initialCompleted,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(initialCurrentSec);
  const [duration, setDuration] = useState(durationSec ?? 0);
  const [completed, setCompleted] = useState(initialCompleted);
  const lastSavedRef = useRef(initialCurrentSec);
  const lastSaveTsRef = useRef(0);

  // 시작 시 재개 위치로 seek (1회)
  useEffect(() => {
    const el = audioRef.current;
    if (!el || initialCurrentSec <= 0) return;
    const onLoaded = () => {
      // duration 까지 도달했으면 처음부터
      if (initialCurrentSec < (el.duration || Infinity) - 2) {
        el.currentTime = initialCurrentSec;
      }
    };
    el.addEventListener("loadedmetadata", onLoaded, { once: true });
    return () => el.removeEventListener("loadedmetadata", onLoaded);
  }, [initialCurrentSec]);

  function saveProgress(sec: number, isCompleted: boolean) {
    fetch("/api/podcast/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        episodeId,
        currentSec: Math.max(0, Math.floor(sec)),
        completed: isCompleted,
      }),
    }).catch(() => undefined);
  }

  function onTimeUpdate() {
    const el = audioRef.current;
    if (!el) return;
    const now = Date.now();
    setCurrent(el.currentTime);
    if (!duration && el.duration) setDuration(el.duration);
    // 5초 throttle 또는 1초 이상 jump
    const dt = now - lastSaveTsRef.current;
    const ds = Math.abs(el.currentTime - lastSavedRef.current);
    if (dt > 5000 || ds > 8) {
      saveProgress(el.currentTime, false);
      lastSaveTsRef.current = now;
      lastSavedRef.current = el.currentTime;
    }
  }

  function onEnded() {
    setPlaying(false);
    setCompleted(true);
    saveProgress(duration || current, true);
  }

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => undefined);
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
      saveProgress(el.currentTime, false);
    }
  }

  function onSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const el = audioRef.current;
    if (!el) return;
    const sec = Number(e.target.value);
    el.currentTime = sec;
    setCurrent(sec);
    saveProgress(sec, false);
  }

  const progressPct =
    duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className="rounded-lg border border-rule bg-card p-5 space-y-3">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onLoadedMetadata={() => {
          const el = audioRef.current;
          if (el?.duration) setDuration(el.duration);
        }}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "일시정지" : "재생"}
          className="grid h-11 w-11 place-items-center rounded-full bg-evergreen text-primary-foreground transition-colors hover:bg-evergreen-strong"
        >
          {playing ? (
            <Pause className="h-5 w-5" aria-hidden />
          ) : (
            <Play className="h-5 w-5 ml-0.5" aria-hidden />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground tabular-nums">
            <span>{fmtTime(current)}</span>
            <span className="opacity-50">/</span>
            <span>{fmtTime(duration)}</span>
            {completed && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-evergreen/10 px-2 py-0.5 text-[10.5px] font-medium text-evergreen">
                완청
              </span>
            )}
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            step={1}
            value={current}
            onChange={onSeek}
            aria-label="재생 위치"
            className="mt-2 w-full accent-evergreen cursor-pointer"
            style={{
              background: `linear-gradient(to right, hsl(var(--color-accent)) 0%, hsl(var(--color-accent)) ${progressPct}%, hsl(var(--color-rule)) ${progressPct}%, hsl(var(--color-rule)) 100%)`,
              height: "4px",
              borderRadius: "999px",
              appearance: "none",
            }}
          />
        </div>
        <Volume2
          className="h-4 w-4 text-muted-foreground shrink-0"
          aria-hidden
        />
      </div>
    </div>
  );
}
