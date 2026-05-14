"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// Track 1.2 (v3.5.4, 헌법 v3.5.3 §16 단서) — 팟캐스트 전역 미니플레이어.
//
// 단일 HTMLAudioElement 가 layout 레벨에서 mount 되어 라우트 이동 시에도 재생
// 지속. 페이지 내 큰 플레이어와 하단 미니플레이어는 같은 audio element 의
// 상태를 컨텍스트로 공유한다.
//
// 청취 진척 저장 로직 (5초 throttle + 8초 점프 즉시 저장 + 종료) 은 본 Provider
// 안에서 처리한다.
//
// 코드 리뷰 수정 (2026-05-12)
// - H3 fix: timeupdate 매 호출 시 setCurrentSec → consumer 재렌더 storm.
//   requestAnimationFrame 로 throttle (60fps 상한). pending flag 로 중복 방지.
// - H4 fix: seek() 의 saveProgress 즉시 호출 제거. 기존 5s/8jump throttle 재사용.
// - M2 fix: play() rejection 시 playError 상태 노출 + console.warn.
// - M3 fix: src 교체 직전 el.pause() 호출 (Chromium "play interrupted" 회피).
// - M8 fix: close() 시 audio src 제거 트레이드오프 코멘트.

type Episode = {
  id: string;
  title: string;
  audioUrl: string;
  durationSec: number | null;
  initialCurrentSec: number;
  initialCompleted: boolean;
};

// 코드리뷰 M18 (2026-05-15) — audioRef 는 외부 소비자가 없어 context 인터페이스
// 에서 제거. 외부에 ref 가 노출되면 캡슐화가 깨지고, audio 노드 직접 조작이
// 가능해진다 → 미니플레이어·karaoke·audio-player 가 메서드만 사용하도록 정합.
type PlayerCtx = {
  episode: Episode | null;
  playing: boolean;
  loading: boolean;
  currentSec: number;
  durationSec: number;
  completed: boolean;
  playError: string | null;
  setEpisode: (ep: Episode) => void;
  togglePlay: () => void;
  seek: (sec: number) => void;
  close: () => void;
};

const Ctx = createContext<PlayerCtx | null>(null);

export function usePodcastPlayer(): PlayerCtx {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error(
      "usePodcastPlayer must be used inside <PodcastPlayerProvider>",
    );
  }
  return v;
}

export function PodcastPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [episode, setEpisodeState] = useState<Episode | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);

  // 진척 저장 throttle 상태.
  const lastSavedRef = useRef(0);
  const lastSaveTsRef = useRef(0);
  const seekTargetRef = useRef<number | null>(null);

  // 리뷰 H3 fix — currentSec rAF throttle 상태.
  // pendingFrameRef: 다음 rAF 핸들. pendingSecRef: 가장 최근 audio.currentTime.
  const pendingFrameRef = useRef<number | null>(null);
  const pendingSecRef = useRef(0);

  const saveProgress = useCallback(
    (epId: string, sec: number, isCompleted: boolean) => {
      fetch("/api/podcast/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeId: epId,
          currentSec: Math.max(0, Math.floor(sec)),
          completed: isCompleted,
        }),
      }).catch(() => undefined);
    },
    [],
  );

  const setEpisode = useCallback((ep: Episode) => {
    setEpisodeState((prev) => {
      if (prev?.id === ep.id) return prev;
      seekTargetRef.current = ep.initialCurrentSec;
      setCurrentSec(ep.initialCurrentSec);
      setDurationSec(ep.durationSec ?? 0);
      setCompleted(ep.initialCompleted);
      setPlaying(false);
      setLoading(true);
      setPlayError(null);
      lastSavedRef.current = ep.initialCurrentSec;
      lastSaveTsRef.current = 0;
      return ep;
    });
  }, []);

  // src 변경 시 audio 재로드 + 재개 위치 seek. 리뷰 M3 fix — 교체 전 pause.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !episode) return;
    if (el.src !== episode.audioUrl) {
      if (!el.paused) {
        try {
          el.pause();
        } catch {
          // ignore
        }
      }
      el.src = episode.audioUrl;
      el.load();
    }
  }, [episode]);

  // 리뷰 H3 fix — currentSec broadcast 를 rAF 1프레임으로 묶음.
  // pendingFrameRef 가 null 일 때만 새 rAF 요청. 다중 timeupdate 가 와도 단일
  // 프레임 안에서 최신값으로 합쳐 setState 1회.
  const flushCurrentSec = useCallback(() => {
    pendingFrameRef.current = null;
    setCurrentSec(pendingSecRef.current);
  }, []);

  const scheduleCurrentSec = useCallback(
    (sec: number) => {
      pendingSecRef.current = sec;
      if (pendingFrameRef.current != null) return;
      if (typeof window === "undefined") return;
      pendingFrameRef.current = window.requestAnimationFrame(flushCurrentSec);
    },
    [flushCurrentSec],
  );

  useEffect(() => {
    return () => {
      if (pendingFrameRef.current != null && typeof window !== "undefined") {
        window.cancelAnimationFrame(pendingFrameRef.current);
        pendingFrameRef.current = null;
      }
    };
  }, []);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el || !episode) return;
    if (el.paused) {
      setPlayError(null);
      el.play().catch((err: unknown) => {
        // 리뷰 M2 fix — 자동재생 정책·로드 에러 등 재생 실패 노출.
        const msg =
          err instanceof Error && err.message ? err.message : "재생 실패";
        if (typeof console !== "undefined") {
          console.warn("[PodcastPlayer] play() rejected:", err);
        }
        setPlayError(msg);
      });
    } else {
      el.pause();
      saveProgress(episode.id, el.currentTime, false);
    }
  }, [episode, saveProgress]);

  const seek = useCallback(
    (sec: number) => {
      const el = audioRef.current;
      if (!el || !episode) return;
      el.currentTime = sec;
      // 리뷰 H4 fix — seek 마다 즉시 saveProgress 하지 않음. 기존 5s/8jump
      // throttle (onTimeUpdate) 에 자연 합류. range drag 시 네트워크 hammering 회피.
      // currentSec 도 timeupdate 가 곧이어 호출되므로 직접 set 하지 않음.
    },
    [episode],
  );

  const close = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      // M8 trade-off note — 브라우저가 audio 버퍼 일부를 GC 까지 보유할 수 있다.
      // Provider 는 layout-singleton 이므로 page navigation 만으로는 unmount 되지
      // 않아 메모리 누적이 의미 있는 수준은 아니다. 명시 close() 호출 시에만 정리.
      el.removeAttribute("src");
      el.load();
    }
    if (episode) {
      saveProgress(episode.id, currentSec, completed);
    }
    setEpisodeState(null);
    setPlaying(false);
    setLoading(false);
    setCurrentSec(0);
    setDurationSec(0);
    setCompleted(false);
    setPlayError(null);
  }, [episode, currentSec, completed, saveProgress]);

  function onLoadedMetadata() {
    const el = audioRef.current;
    if (!el) return;
    if (el.duration) setDurationSec(el.duration);
    const target = seekTargetRef.current;
    if (
      target != null &&
      target > 0 &&
      target < (el.duration || Infinity) - 2
    ) {
      el.currentTime = target;
    }
    seekTargetRef.current = null;
  }

  function onTimeUpdate() {
    const el = audioRef.current;
    if (!el || !episode) return;
    const now = Date.now();
    // 리뷰 H3 fix — setCurrentSec 직접 호출 X. rAF throttle 통해 1 프레임당 1회만.
    scheduleCurrentSec(el.currentTime);
    if (!durationSec && el.duration) setDurationSec(el.duration);
    const dt = now - lastSaveTsRef.current;
    const ds = Math.abs(el.currentTime - lastSavedRef.current);
    if (dt > 5000 || ds > 8) {
      saveProgress(episode.id, el.currentTime, false);
      lastSaveTsRef.current = now;
      lastSavedRef.current = el.currentTime;
    }
  }

  function onEnded() {
    setPlaying(false);
    setCompleted(true);
    if (episode) saveProgress(episode.id, durationSec || currentSec, true);
  }

  const value: PlayerCtx = {
    episode,
    playing,
    loading,
    currentSec,
    durationSec,
    completed,
    playError,
    setEpisode,
    togglePlay,
    seek,
    close,
  };

  return (
    <Ctx.Provider value={value}>
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onLoadedMetadata={onLoadedMetadata}
        onLoadStart={() => setLoading(true)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlaying={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
      {children}
    </Ctx.Provider>
  );
}
