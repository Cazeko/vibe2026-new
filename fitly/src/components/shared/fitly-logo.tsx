import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

type Props = {
  size?: Size;
  variant?: "mark+word" | "mark" | "word";
  /** 다크 배경(예: hero) 위 사용 시 cream/gold 톤으로 전환 */
  onAccentBg?: boolean;
  className?: string;
};

const MARK_BOX = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-14 w-14",
} as const;

const WORD_SIZE = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
} as const;

/**
 * Fitly 로고 — 신규 디자인(L05) ㅍ-jaso 모티프.
 * 5개의 사각형(상단 가로 + 좌·우 세로 + 하단 가로 + 내부 작은 인셋)이
 * 한글 "ㅍ" 자소 + 학습 진도 그리드의 결합을 표현한다.
 */
export function FitlyLogo({
  size = "md",
  variant = "mark+word",
  onAccentBg = false,
  className,
}: Props) {
  const showMark = variant === "mark+word" || variant === "mark";
  const showWord = variant === "mark+word" || variant === "word";

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      {showMark && (
        // 주인님 보고 #19 (2026-05-14) — 종전 svg 가 viewBox 안에서 12~88 영역만
        // 차지하여 초록 박스 중앙에 *살짝 우상단* 으로 어긋나 보이던 회귀. 정사각형
        // 박스 *정중앙* 에 자소가 더 크게 차도록 (svg 88% width + 중앙 grid place)
        // viewBox 자체를 12~88 영역으로 잡아 시각 중심 정합.
        <span
          aria-hidden
          className={cn(
            "grid shrink-0 place-items-center rounded-lg bg-evergreen",
            MARK_BOX[size]
          )}
        >
          <svg
            viewBox="20 24 60 52"
            xmlns="http://www.w3.org/2000/svg"
            className="h-[88%] w-[88%]"
            aria-hidden
          >
            <g fill="hsl(var(--color-bg))">
              <rect x="22" y="28" width="56" height="7" rx="1" />
              <rect x="33" y="35" width="7" height="30" rx="1" />
              <rect x="60" y="35" width="7" height="30" rx="1" />
              <rect x="22" y="65" width="56" height="7" rx="1" />
              <rect x="40" y="42" width="20" height="16" rx="1" opacity="0.35" />
            </g>
          </svg>
        </span>
      )}
      {showWord && (
        <span
          className={cn(
            "inline-flex items-baseline font-semibold tracking-[-0.02em] leading-none",
            WORD_SIZE[size],
            onAccentBg ? "text-cream" : "text-foreground"
          )}
        >
          <span
            className={cn(
              "italic font-extrabold pr-[0.04em]",
              onAccentBg ? "text-gold" : "text-evergreen"
            )}
          >
            Fit
          </span>
          <span>ly</span>
          <span className={onAccentBg ? "text-gold" : "text-gold"}>.</span>
        </span>
      )}
    </span>
  );
}
