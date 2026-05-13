"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// 헌법 v3.5.3 §16 단서 — 인터랙션 패턴 보완(스플릿 뷰). 기존 본문/답안 카드의
// 시각 위계를 좌우 분할로 보강. 모바일 이하는 vertical stack fallback.
//
// 구현 요지
// 1. xl(≥1280px) 미만은 항상 vertical stack — left/right children 을 순서대로 렌더.
// 2. xl 이상은 grid (left | resizer | right). resizer 는 8px 영역, hover 시 시각.
// 3. drag(또는 ←/→ 키) 로 left 비율 조정. localStorage 에 저장(storageKey 별).
// 4. left 가 sticky 옵션을 받으면 top-[X] 적용(본문 영역이 답안 입력 스크롤 추종).
//
// WAI-ARIA: role="separator" + aria-orientation="vertical" + aria-valuenow.
//
// 코드 리뷰 수정 (2026-05-12)
// - H5 fix: drag 중 setState 매 pointermove → 60-120Hz 전체 재렌더 storm + IME
//   composition loss. ratio 를 ref 로 보관 + container `style.gridTemplateColumns`
//   를 직접 write. pointerup 시에만 setRatio() → localStorage 저장 트리거.
//   ARIA aria-valuenow 도 separator dataset 으로 직접 write.
// - H7 fix: setPointerCapture(e.target) → (e.currentTarget). 내부 span 이 target
//   일 때 capture 가 잘못된 노드에 걸리는 회귀 방지.
// - M1 fix: gridTemplateColumns 인라인 style 은 xl 이상에서만 적용. 모바일에서는
//   flex-col 이므로 grid template 자체가 dead. CSS 변수로 정합.
// - M6 fix: localStorage 복원을 useLayoutEffect 로 paint 전에 처리 → 플리커 회피.

type Props = {
  left: ReactNode;
  right: ReactNode;
  storageKey: string;
  defaultRatio?: number; // 0.3 ~ 0.7, 기본 0.5
  minRatio?: number; // 기본 0.3
  maxRatio?: number; // 기본 0.7
  stickyLeft?: boolean; // 좌측 sticky 적용 여부 (본문 영역에 유용)
  stickyTop?: string; // sticky 적용 시 top 오프셋. 기본 top-24
  ariaLabel?: string;
};

const RATIO_KEY_PREFIX = "fitly:split-ratio:";

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function SplitView({
  left,
  right,
  storageKey,
  defaultRatio = 0.5,
  minRatio = 0.3,
  maxRatio = 0.7,
  stickyLeft = false,
  stickyTop = "top-24",
  ariaLabel = "본문 답안 분할 비율",
}: Props) {
  const [ratio, setRatio] = useState(defaultRatio);
  const ratioRef = useRef(defaultRatio);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const separatorRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const separatorId = useId();

  // 리뷰 M6 fix — paint 전에 localStorage 복원 (useLayoutEffect).
  // 단 SSR 에서 window 이 없으므로 try-catch + 노옵 가드.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(
        `${RATIO_KEY_PREFIX}${storageKey}`,
      );
      if (raw) {
        const v = Number(raw);
        if (Number.isFinite(v) && v >= minRatio && v <= maxRatio) {
          setRatio(v);
          ratioRef.current = v;
          applyTemplate(v);
        }
      }
    } catch {
      // localStorage 차단 / 파싱 실패 → 기본값 유지.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // ratio state 가 바뀌면 (pointerup·키보드 시) DOM 동기화 + localStorage 저장.
  // drag 중 매 프레임은 applyTemplate 직접 호출 (setState 우회).
  useEffect(() => {
    ratioRef.current = ratio;
    applyTemplate(ratio);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(`${RATIO_KEY_PREFIX}${storageKey}`, String(ratio));
    } catch {
      // 무시
    }
  }, [ratio, storageKey]);

  // container 의 grid-template-columns 와 separator 의 aria-valuenow 를 직접 write.
  // React 재렌더 없이 매 프레임 호출 가능.
  const applyTemplate = useCallback((r: number) => {
    const c = containerRef.current;
    if (c) {
      c.style.setProperty(
        "--split-ratio-left",
        `minmax(0, ${r}fr)`,
      );
      c.style.setProperty(
        "--split-ratio-right",
        `minmax(0, ${1 - r}fr)`,
      );
    }
    const s = separatorRef.current;
    if (s) {
      const pct = Math.round(r * 100);
      s.setAttribute("aria-valuenow", String(pct));
      s.setAttribute("aria-valuetext", `좌측 ${pct}%`);
    }
  }, []);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const next = clamp((clientX - rect.left) / rect.width, minRatio, maxRatio);
      ratioRef.current = next;
      applyTemplate(next);
    },
    [minRatio, maxRatio, applyTemplate],
  );

  // Pointer events — mouse + touch 통합.
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onMove(e: PointerEvent) {
      if (!draggingRef.current) return;
      e.preventDefault();
      updateFromClientX(e.clientX);
    }
    function onUp() {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      // 드래그 종료 시점에만 React state 동기화 → localStorage 저장 트리거.
      setRatio(ratioRef.current);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [updateFromClientX]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    // 리뷰 H7 fix — e.target 은 내부 span 일 수 있음. currentTarget 으로 capture.
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const STEP = 0.02;
    let next: number | null = null;
    if (e.key === "ArrowLeft") next = clamp(ratioRef.current - STEP, minRatio, maxRatio);
    else if (e.key === "ArrowRight") next = clamp(ratioRef.current + STEP, minRatio, maxRatio);
    else if (e.key === "Home") next = minRatio;
    else if (e.key === "End") next = maxRatio;
    else if (e.key === "Enter" || e.key === " ") next = defaultRatio;
    if (next != null) {
      e.preventDefault();
      setRatio(next);
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-5 xl:gap-0 xl:grid xl:items-start xl:[grid-template-columns:var(--split-ratio-left,minmax(0,0.5fr))_8px_var(--split-ratio-right,minmax(0,0.5fr))]"
    >
      {/* 좌측 — xl 이상에서 옵션 sticky */}
      <div
        className={cn(
          "min-w-0",
          stickyLeft && "xl:sticky",
          stickyLeft && stickyTop,
        )}
      >
        {left}
      </div>

      {/* 리사이저 — xl 미만에서는 숨김 (모바일은 vertical stack) */}
      <div
        ref={separatorRef}
        id={separatorId}
        role="separator"
        aria-orientation="vertical"
        aria-label={ariaLabel}
        aria-valuemin={Math.round(minRatio * 100)}
        aria-valuemax={Math.round(maxRatio * 100)}
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuetext={`좌측 ${Math.round(ratio * 100)}%`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={onKey}
        title="드래그 또는 ←/→ 키로 비율 조정. Enter 로 기본값."
        className={cn(
          "hidden xl:flex items-center justify-center cursor-col-resize select-none group touch-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40",
          stickyLeft && "xl:sticky",
          stickyLeft && stickyTop,
          stickyLeft && "self-stretch",
        )}
      >
        {/* v3.6 외부 평가 #3.1 — drag 어포던스 강화: 세로 막대 + 중앙 세 개의 점
            (⋮) 그립. col-resize cursor 는 wrapping div 에 이미 적용. */}
        <span
          aria-hidden
          className="relative flex flex-col items-center justify-center gap-1 h-14 w-3 pointer-events-none"
        >
          <span className="block h-12 w-[3px] rounded-full bg-rule-strong group-hover:bg-evergreen/60 group-focus-visible:bg-evergreen transition-colors" />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-[3px] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
            <span className="block h-[3px] w-[3px] rounded-full bg-white/95" />
            <span className="block h-[3px] w-[3px] rounded-full bg-white/95" />
            <span className="block h-[3px] w-[3px] rounded-full bg-white/95" />
          </span>
        </span>
      </div>

      {/* 우측 */}
      <div className="min-w-0">{right}</div>
    </div>
  );
}
