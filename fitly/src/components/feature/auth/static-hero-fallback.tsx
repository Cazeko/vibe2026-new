// 모바일·prefers-reduced-motion·SSR 시 노출되는 정적 SVG fallback.
// three.js 미로드. 펀치라인 + 가로 괘선만 표시. 헌법 §10.2 + DESIGN.md §10.2 정합.

export function StaticHeroFallback() {
  return (
    <div className="relative w-full h-full flex items-center justify-center px-8 py-12">
      {/* 가로 괘선 — DESIGN.md §6.3 노트 메타포 */}
      <svg
        className="absolute inset-0 w-full h-full"
        aria-hidden
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="ruled-paper"
            x="0"
            y="0"
            width="100%"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="32"
              x2="100%"
              y2="32"
              stroke="hsl(var(--color-rule))"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ruled-paper)" />
      </svg>

      <div className="relative max-w-md">
        <p className="font-serif text-2xl md:text-3xl lg:text-[2.2rem] leading-[1.4] tracking-tight text-foreground/90">
          임용은 열심히 하는 게 아니라,
          <br />
          <em className="not-italic font-semibold text-evergreen">
            맞게(Fit)
          </em>{" "}
          하는 게임입니다.
        </p>
        <p className="mt-6 text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
          Fitly — 초등 임용 1차 학습 플래너
        </p>
      </div>
    </div>
  );
}
