"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Columns2,
  FileText,
} from "lucide-react";
import { formatExamStem } from "@/lib/exam/format-stem";

// 백승환 피드백 #5+#6 (2026-05-13) — 학습 Lightbox 뷰어.
//
// 새 탭 이미지 열기를 서비스 내부 모달로 대체. 사용자가 답안·해설 확인 흐름에서
// 이탈하지 않도록 같은 페이지 안에서 본문 zoom + 텍스트 병렬 보기.
//
// ARIA dialog 패턴
// - role="dialog" + aria-modal="true" + aria-labelledby/aria-describedby
// - Esc 키 close + backdrop click close + focus trap
// - 열림 동안 body scroll lock (cleanup 시 prev overflow 복원)
//
// 줌
// - 4 단계 (100/150/200/300%) — study-card-form PdfImage 와 동일 정합
// - "원본 크기" 리셋 버튼
//
// 모드
// - "image"  — 이미지 전용 (기본)
// - "split"  — 좌 이미지 / 우 텍스트 병렬 (xl+ 만 의미. 모바일은 탭 토글)
// - "text"   — 텍스트 전용

type Props = {
  open: boolean;
  onClose: () => void;
  itemNo: number;
  imageUrl: string | null;
  stemText: string;
  paperLabel: string;
  initialMode?: Mode;
};

type Mode = "image" | "split" | "text";

const ZOOM_STEPS = [1, 1.5, 2, 3];

export function ExamItemLightbox({
  open,
  onClose,
  itemNo,
  imageUrl,
  stemText,
  paperLabel,
  initialMode = "image",
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [zoom, setZoom] = useState(1);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // SSR 회피용 — createPortal 은 클라이언트 mount 후만 가능.
  useEffect(() => {
    setMounted(true);
  }, []);

  // 열림 시 body 스크롤 잠금 + 초기 포커스. AppSidebar 와 동일한 prev overflow
  // 캡처 패턴으로 다른 dialog 의 lock 침범 회피.
  // 리뷰 M9 fix — single-instance 전제. 두 lightbox 동시 open 시 prev 캡처가
  // 잘못 누적될 수 있으나 본 페이지는 카드당 1 lightbox 만 open 한다.
  useEffect(() => {
    if (!open) return;
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // 리뷰 H1 fix — 백그라운드 page 의 main 영역에 inert 적용하여 Tab 이 모달
    // 바깥으로 빠지지 못하도록. main 이 없으면 보조로 aria-hidden 적용.
    const main = document.querySelector("main");
    let inertApplied = false;
    if (main && !main.hasAttribute("inert")) {
      main.setAttribute("inert", "");
      inertApplied = true;
    }
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      if (inertApplied) main?.removeAttribute("inert");
      clearTimeout(t);
    };
  }, [open]);

  // Esc 키 close + 줌 단축키 + Tab 포커스 트랩.
  // 리뷰 H1 fix — Tab/Shift+Tab 으로 dialog 안 focusable 요소 사이만 순환.
  // 리뷰 H2 fix — input/textarea/contentEditable 안에서는 줌 단축키 skip.
  useEffect(() => {
    if (!open) return;
    if (typeof document === "undefined") return;
    function isEditable(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target.isContentEditable
      );
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        // 포커스 트랩 — dialog 안 focusable 요소 사이만 순환.
        const dlg = dialogRef.current;
        if (!dlg) return;
        const focusables = dlg.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const list = Array.from(focusables).filter(
          (el) => !el.hasAttribute("disabled"),
        );
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      // 줌 단축키 — 텍스트 모드/입력 포커스 시 skip.
      if (isEditable(e.target)) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((z) => {
          const idx = ZOOM_STEPS.findIndex((s) => Math.abs(s - z) < 0.01);
          return ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, idx + 1)] ?? z;
        });
      } else if (e.key === "-") {
        e.preventDefault();
        setZoom((z) => {
          const idx = ZOOM_STEPS.findIndex((s) => Math.abs(s - z) < 0.01);
          return ZOOM_STEPS[Math.max(0, idx - 1)] ?? z;
        });
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 열기 시 mode 초기화 (props 변경 반영).
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  if (!mounted || !open) return null;
  if (typeof document === "undefined") return null;

  const zoomIdx = ZOOM_STEPS.findIndex((s) => Math.abs(s - zoom) < 0.01);
  const canZoomIn = zoomIdx < ZOOM_STEPS.length - 1;
  const canZoomOut = zoomIdx > 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-item-lightbox-title"
      className="fixed inset-0 z-[100] flex items-stretch justify-center"
    >
      {/* backdrop — 클릭 시 닫기. */}
      <div
        className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={dialogRef}
        className="relative z-10 m-auto w-[min(96vw,1400px)] h-[min(94vh,900px)] flex flex-col rounded-lg border border-rule bg-card shadow-2xl"
      >
        {/* 헤더 — 제목 + 모드 토글 + 줌 + 닫기 */}
        <header className="flex items-center gap-3 px-4 py-2.5 border-b border-rule flex-wrap">
          <div className="min-w-0 flex items-baseline gap-2">
            <h2
              id="exam-item-lightbox-title"
              className="font-serif text-[15px] font-medium tracking-tight tabular-nums"
            >
              {itemNo}번
            </h2>
            <span className="text-[11px] text-muted-foreground truncate">
              {paperLabel}
            </span>
          </div>

          {/* 모드 토글 — 이미지·분할·텍스트. xl+ 에서 분할 의미. */}
          <div
            className="ml-auto inline-flex items-center rounded-md border border-rule overflow-hidden"
            role="tablist"
            aria-label="보기 모드"
          >
            {imageUrl && (
              <ModeButton
                active={mode === "image"}
                onClick={() => setMode("image")}
                label="이미지"
                icon={<Maximize2 className="h-3 w-3" aria-hidden />}
              />
            )}
            {imageUrl && stemText && (
              <ModeButton
                active={mode === "split"}
                onClick={() => setMode("split")}
                label="분할"
                icon={<Columns2 className="h-3 w-3" aria-hidden />}
              />
            )}
            {stemText && (
              <ModeButton
                active={mode === "text"}
                onClick={() => setMode("text")}
                label="텍스트"
                icon={<FileText className="h-3 w-3" aria-hidden />}
              />
            )}
          </div>

          {/* 줌 — 이미지/분할 모드에서만 노출. */}
          {mode !== "text" && imageUrl && (
            <div className="inline-flex items-center gap-1 rounded-md border border-rule px-1 py-0.5">
              <button
                type="button"
                onClick={() => canZoomOut && setZoom(ZOOM_STEPS[zoomIdx - 1])}
                disabled={!canZoomOut}
                aria-label="축소"
                title="축소 (-)"
                className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-secondary/60 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
              >
                <ZoomOut className="h-3.5 w-3.5" aria-hidden />
              </button>
              <span className="text-[10.5px] text-muted-foreground tabular-nums w-9 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => canZoomIn && setZoom(ZOOM_STEPS[zoomIdx + 1])}
                disabled={!canZoomIn}
                aria-label="확대"
                title="확대 (+)"
                className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-secondary/60 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
              >
                <ZoomIn className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                disabled={zoom === 1}
                aria-label="원본 크기"
                title="원본 크기"
                className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-secondary/60 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          )}

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="닫기"
            title="닫기 (Esc)"
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        {/* 본문 영역 */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {mode === "image" && imageUrl && (
            <ImagePanel src={imageUrl} zoom={zoom} itemNo={itemNo} />
          )}
          {mode === "text" && (
            <TextPanel stemText={stemText} />
          )}
          {mode === "split" && imageUrl && stemText && (
            <div className="h-full grid xl:grid-cols-2 grid-cols-1 grid-rows-[1fr_1fr] xl:grid-rows-1 divide-y xl:divide-y-0 xl:divide-x divide-rule">
              <ImagePanel src={imageUrl} zoom={zoom} itemNo={itemNo} />
              <TextPanel stemText={stemText} />
            </div>
          )}
          {/* 리뷰 M8 fix — split 모드 진입 시 stemText 없으면 image 단독 폴백. */}
          {mode === "split" && imageUrl && !stemText && (
            <ImagePanel src={imageUrl} zoom={zoom} itemNo={itemNo} />
          )}
        </div>

        {/* 푸터 — 키보드 안내 */}
        <footer className="border-t border-rule px-4 py-2 text-[10.5px] text-muted-foreground tabular-nums flex items-center gap-3 flex-wrap">
          <span>키보드 Esc 닫기</span>
          {mode !== "text" && (
            <>
              <span>· + 확대</span>
              <span>· − 축소</span>
            </>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function ModeButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] transition-colors ${
        active
          ? "bg-evergreen/10 text-evergreen font-medium"
          : "text-muted-foreground hover:bg-secondary/60"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ImagePanel({
  src,
  zoom,
  itemNo,
}: {
  src: string;
  zoom: number;
  itemNo: number;
}) {
  return (
    <div
      className="h-full overflow-auto bg-cream-soft"
      aria-label={`${itemNo}번 본문 이미지 영역`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${itemNo}번 본문 이미지`}
        className="block w-full origin-top-left transition-transform duration-150"
        style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
      />
    </div>
  );
}

function TextPanel({ stemText }: { stemText: string }) {
  // 백승환 추가 보고 (2026-05-13) — PDF 추출본 raw 노출 → formatExamStem 으로
  // 자료 블록·발문 번호 인식 + 공백·줄바꿈 정리. 시드 데이터는 보존, 표시만 가공.
  const cleaned = formatExamStem(stemText);
  return (
    <div className="h-full overflow-auto p-6 bg-paper/30">
      <p className="font-serif text-[14px] leading-[1.8] text-foreground/90 whitespace-pre-wrap break-keep max-w-prose">
        {cleaned || "본문 텍스트가 없습니다."}
      </p>
    </div>
  );
}
