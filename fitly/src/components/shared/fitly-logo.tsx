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
        <span
          aria-hidden
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-lg bg-evergreen",
            MARK_BOX[size]
          )}
        >
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="h-[55%] w-[55%]">
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
