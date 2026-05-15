"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pause, Play, X, Rewind, FastForward, Volume2, VolumeX } from "lucide-react";
import { usePodcastPlayer } from "@/components/shared/podcast-player-provider";

// Track 1.2 — sticky bottom 미니플레이어. 활성 에피소드가 있을 때만 노출.
// lg+ 사이드바 오프셋은 `--sidebar-w` 변수를 직접 참조한다 (단일 소스).
//
// 리뷰 H1+H2 fix — mount 시 CSS 변수 `--mini-player-h` 를 root에 셋업하여
// (main) layout 의 main pb 와 study-card-form sticky bottom 등급 카드가 이를
// 소비. unmount 시 0px 복원. 미니플레이어 fixed 가 다른 sticky 요소를 가리는
// 회귀 방지.

const MINI_PLAYER_H_PX = 76; // 측정값: py-2.5(20) + h-10(40) + 2 lines text + border-t

function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function PodcastMiniPlayer() {
  const router = useRouter();
  const {
    episode,
    playing,
    loading,
    currentSec,
    durationSec,
    completed,
    volume,
    muted,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    close,
  } = usePodcastPlayer();

  // 리뷰 H1+H2 fix — 활성 에피소드 존재 시에만 CSS 변수 세팅. 다른 페이지가 본
  // 변수를 sticky offset / padding 으로 참조 가능. 종료/언마운트 시 0 복원.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (episode) {
      root.style.setProperty("--mini-player-h", `${MINI_PLAYER_H_PX}px`);
    } else {
      root.style.setProperty("--mini-player-h", "0px");
    }
    return () => {
      root.style.setProperty("--mini-player-h", "0px");
    };
  }, [episode]);

  if (!episode) return null;

  const progressPct =
    durationSec > 0 ? Math.min(100, (currentSec / durationSec) * 100) : 0;

  function goToEpisode() {
    if (episode) router.push(`/podcast/${episode.id}`);
  }

  return (
    <div
      role="region"
      aria-label="팟캐스트 미니플레이어"
      className="fixed bottom-0 inset-x-0 lg:left-[var(--sidebar-w,188px)] z-40 border-t border-rule bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 shadow-[0_-6px_18px_rgba(26,32,39,0.06)]"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-2.5 flex items-center gap-2 sm:gap-3">
        {/* v3.6 외부 평가 #5.2 — 15초 뒤로 (수험생이 해설을 다시 듣는 학습 패턴 정합). */}
        <button
          type="button"
          onClick={() => seek(Math.max(0, currentSec - 15))}
          aria-label="15초 뒤로"
          disabled={loading}
          className="hidden sm:grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted2-deep hover:bg-secondary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 disabled:opacity-50"
        >
          <Rewind className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "일시정지" : "재생"}
          aria-pressed={playing}
          disabled={loading}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-evergreen text-primary-foreground hover:bg-evergreen-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen focus-visible:ring-offset-2 disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : playing ? (
            <Pause className="h-4 w-4" aria-hidden />
          ) : (
            <Play className="h-4 w-4 ml-0.5" aria-hidden />
          )}
        </button>
        {/* v3.6 외부 평가 #5.2 — 15초 앞으로. */}
        <button
          type="button"
          onClick={() => seek(Math.min(durationSec || currentSec + 15, currentSec + 15))}
          aria-label="15초 앞으로"
          disabled={loading}
          className="hidden sm:grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted2-deep hover:bg-secondary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 disabled:opacity-50"
        >
          <FastForward className="h-4 w-4" aria-hidden />
        </button>

        <button
          type="button"
          onClick={goToEpisode}
          className="flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 rounded"
        >
          <p className="truncate text-[12.5px] font-medium text-foreground">
            {episode.title}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[10.5px] text-muted-foreground tabular-nums">
            <span>{fmtTime(currentSec)}</span>
            <span className="opacity-50">/</span>
            <span>{fmtTime(durationSec)}</span>
            {completed && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-evergreen/10 px-1.5 py-0.5 text-[10px] font-medium text-evergreen">
                완청
              </span>
            )}
          </div>
        </button>

        {/* 리뷰 M5 fix — progressPct 를 CSS 변수로 분리.
            v3.6 외부 평가 #5.3 — 진행 바 hit-box 확대. 시각 두께 4px 유지하되
            py-3 의 wrapping label 로 위아래 12px 터치 영역 확보 (≥24px). */}
        <label className="hidden sm:flex items-center py-3 -my-3 cursor-pointer">
          <input
            type="range"
            min={0}
            max={Math.max(durationSec, 1)}
            step={1}
            value={currentSec}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="재생 위치"
            disabled={loading}
            className="w-32 lg:w-48 accent-evergreen cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 rounded-full audio-range-bar"
            style={
              {
                "--progress": `${progressPct}%`,
                height: "4px",
                borderRadius: "999px",
                appearance: "none",
              } as React.CSSProperties
            }
          />
        </label>

        {/* 2026-05-16 (주인님 명시 요청) — 볼륨 컨트롤. ui-ux-pro-max 자문 정합 —
            데스크톱(sm+) 은 hover/focus-within 으로 슬라이더 펼침. 모바일(sm-)
            은 아이콘만 노출(44×44 터치 타겟) + 음소거 토글만 제공 — "회의 들어갈
            때 즉시 음소거" UX 보존. */}
        <div className="group/vol relative shrink-0 flex items-center">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "음소거 해제" : "음소거"}
            aria-pressed={muted}
            className="grid h-11 w-11 sm:h-9 sm:w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 transition-colors"
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-4 w-4" aria-hidden />
            ) : (
              <Volume2 className="h-4 w-4" aria-hidden />
            )}
          </button>
          {/* 슬라이더 — 데스크톱에서만 노출. hover/focus-within 으로 펼침. */}
          <div className="hidden sm:flex items-center overflow-hidden transition-[width,opacity,margin] duration-150 w-0 opacity-0 ml-0 group-hover/vol:w-24 group-hover/vol:opacity-100 group-hover/vol:ml-2 focus-within:w-24 focus-within:opacity-100 focus-within:ml-2">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={muted ? 0 : Math.round(volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              aria-label="볼륨"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={muted ? 0 : Math.round(volume * 100)}
              aria-valuetext={`${muted ? 0 : Math.round(volume * 100)}%`}
              title={`볼륨 ${muted ? 0 : Math.round(volume * 100)}%`}
              className={`audio-range audio-range-bar w-24 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 rounded-full ${
                muted ? "opacity-50" : ""
              }`}
              style={
                {
                  "--progress": `${muted ? 0 : Math.round(volume * 100)}%`,
                  height: "4px",
                  borderRadius: "999px",
                  appearance: "none",
                } as React.CSSProperties
              }
            />
          </div>
        </div>

        <button
          type="button"
          onClick={close}
          aria-label="플레이어 닫기"
          title="플레이어 닫기 — 청취 위치는 저장됩니다."
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
