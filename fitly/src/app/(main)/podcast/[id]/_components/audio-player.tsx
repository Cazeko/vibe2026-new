"use client";

import { useEffect } from "react";
import { Play, Pause, Volume2, Loader2 } from "lucide-react";
import { usePodcastPlayer } from "@/components/shared/podcast-player-provider";

// 헌법 v3.0 §13의3 4항 — 청취 진척 저장 (재개 가능).
// Track 1.2 (v3.5.4) — 전역 PlayerProvider 의 audio element 를 공유.
// 페이지 진입 시 setEpisode 로 등록 → 라우트 이동에도 재생 지속.
// 본 컴포넌트는 페이지 내 큰 컨트롤 (재생 버튼 + seek bar) 만 제공.

type Props = {
  episodeId: string;
  episodeTitle: string;
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
  episodeTitle,
  audioUrl,
  durationSec,
  initialCurrentSec,
  initialCompleted,
}: Props) {
  const {
    episode,
    playing,
    loading,
    currentSec,
    durationSec: ctxDuration,
    completed,
    playError,
    setEpisode,
    togglePlay,
    seek,
  } = usePodcastPlayer();

  // 페이지 진입 시 컨텍스트에 등록. 같은 id 이면 Provider 가 no-op.
  useEffect(() => {
    setEpisode({
      id: episodeId,
      title: episodeTitle,
      audioUrl,
      durationSec,
      initialCurrentSec,
      initialCompleted,
    });
  }, [
    episodeId,
    episodeTitle,
    audioUrl,
    durationSec,
    initialCurrentSec,
    initialCompleted,
    setEpisode,
  ]);

  // 활성 에피소드와 본 페이지 id 가 다르면 (이전 에피소드 재생 중에 새 페이지 진입
  // 직후 한 프레임 동안) 안전을 위해 0/0 으로 표시. setEpisode effect 가 즉시
  // 전환하므로 통상 1프레임.
  const isActive = episode?.id === episodeId;
  const cur = isActive ? currentSec : initialCurrentSec;
  const dur = isActive ? ctxDuration : (durationSec ?? 0);
  const isCompleted = isActive ? completed : initialCompleted;
  const isLoading = isActive ? loading : true;
  const isPlaying = isActive ? playing : false;

  const progressPct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
  const playLabel = isPlaying ? "일시정지" : "재생";

  return (
    <div className="rounded-lg border border-rule bg-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playLabel}
          aria-pressed={isPlaying}
          disabled={isLoading || !isActive}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-evergreen text-primary-foreground transition-colors hover:bg-evergreen-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen focus-visible:ring-offset-2 disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" aria-hidden />
          ) : (
            <Play className="h-5 w-5 ml-0.5" aria-hidden />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground tabular-nums">
            <span>{fmtTime(cur)}</span>
            <span className="opacity-50">/</span>
            <span>{fmtTime(dur)}</span>
            {isCompleted && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-evergreen/10 px-2 py-0.5 text-[10.5px] font-medium text-evergreen">
                완청
              </span>
            )}
            {isLoading && (
              <span className="ml-1 text-[10.5px] text-muted-foreground/80">
                준비 중…
              </span>
            )}
          </div>
          <div className="mt-1 py-2.5">
            {/* 리뷰 M5 fix — progressPct 를 CSS 변수로 분리 (audio-range-bar). */}
            <input
              type="range"
              min={0}
              max={Math.max(dur, 1)}
              step={1}
              value={cur}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="재생 위치"
              aria-valuemin={0}
              aria-valuemax={Math.max(dur, 1)}
              aria-valuenow={Math.floor(cur)}
              aria-valuetext={`${fmtTime(cur)} / ${fmtTime(dur)}`}
              disabled={isLoading || !isActive}
              className="audio-range audio-range-bar w-full accent-evergreen cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen focus-visible:ring-offset-2 rounded-full"
              style={
                {
                  "--progress": `${progressPct}%`,
                  height: "6px",
                  borderRadius: "999px",
                  appearance: "none",
                } as React.CSSProperties
              }
            />
          </div>
        </div>
        <Volume2
          className="h-4 w-4 text-muted-foreground shrink-0"
          aria-hidden
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {isLoading
          ? "오디오 준비 중"
          : isPlaying
            ? "재생 중"
            : isCompleted
              ? "완청 — 일시정지"
              : "일시정지"}
      </p>
      {/* 리뷰 M2 fix — play() rejection 시 사용자 인지 가능한 메시지 노출. */}
      {playError && isActive && (
        <p
          role="alert"
          className="text-[11px] text-warning-text leading-relaxed break-keep"
        >
          재생을 시작할 수 없습니다. 재생 버튼을 한 번 더 눌러 주세요.
        </p>
      )}
      <p className="text-[10.5px] text-muted-foreground/80 leading-relaxed break-keep">
        하단 미니플레이어로 다른 페이지를 보는 동안에도 재생이 유지됩니다.
      </p>
    </div>
  );
}
