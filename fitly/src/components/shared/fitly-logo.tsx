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
        // 주인님 보고 #19 + F6 사후 리뷰 (2026-05-15) — viewBox 를 100×100 정사각형
        // 으로 되돌리고 자소를 22~78 영역(56×56)의 정중앙에 재배치. 종전 60×52
        // 비율은 시각 중심이 위로 치우쳐 보이던 회귀. 자소가 박스에 꽉 차도록
        // svg 자체는 80% 폭 + 박스 정중앙 grid place.
        <span
          aria-hidden
          className={cn(
            "grid shrink-0 place-items-center rounded-lg bg-evergreen",
            MARK_BOX[size]
          )}
        >
          <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="h-[80%] w-[80%]"
            aria-hidden
          >
            <g fill="hsl(var(--color-bg))">
              {/* ㅍ 자소 — 22~78 영역(56×56) 정중앙.
                  상단 가로 (22,29)~(78,36), 좌측 세로 (32,36)~(39,64),
                  우측 세로 (61,36)~(68,64), 하단 가로 (22,64)~(78,71),
                  내부 인셋 (42,42)~(58,58) 16×16. */}
              <rect x="22" y="29" width="56" height="7" rx="1" />
              <rect x="32" y="36" width="7" height="28" rx="1" />
              <rect x="61" y="36" width="7" height="28" rx="1" />
              <rect x="22" y="64" width="56" height="7" rx="1" />
              <rect x="42" y="42" width="16" height="16" rx="1" opacity="0.35" />
            </g>
          </svg>
        </span>
      )}
      {showWord && (
        <span
          className={cn(
            "inline-flex items-baseline font-semibold tracking-[-0.02em] leading-none",
            WORD_SIZE[size],
            onAccentBg
              ? // 2026-05-16 — `text-cream` 토큰이 다크에서 `--color-bg`(거의 검정)
                // 으로 매핑되어 hero 배경 위 가시성 0 (사이드바 회귀와 동일 원인).
                // `dark:text-foreground` 로 다크 모드에서도 밝게 유지.
                "text-cream dark:text-foreground"
              : "text-foreground"
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
