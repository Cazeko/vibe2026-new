// 모바일·prefers-reduced-motion·SSR 시 노출되는 정적 fallback.
// three.js 미로드. 펀치라인 + 가로 괘선만 표시. 헌법 §10.2 + DESIGN.md §10.2 정합.
//
// 가로 괘선은 CSS background gradient로 (이전 SVG pattern은 100% width 단위
// 해석 문제로 렌더링 X였다).

export function StaticHeroFallback() {
  return (
    <div
      className="relative w-full h-full min-h-[30vh] lg:min-h-screen flex items-center justify-center px-8 py-12 overflow-hidden"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, hsl(var(--color-rule)) 31px, hsl(var(--color-rule)) 32px)",
      }}
    >
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
