// L1 헌법 v3.5.1 — 학습 분석 스켈레톤. 차트 깜빡임 방지.
// 헌법 제16조의2 디자인 시스템 — bg-card / border-rule 토큰 정합.

export default function Loading() {
  return (
    <div className="min-h-screen pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3 px-6 pt-5 pb-3">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
            학습 분석
          </h1>
          <div className="skeleton h-3.5 w-72 rounded-md mt-2" />
        </div>
      </header>

      <div className="px-6 mx-auto max-w-7xl space-y-3">
        {/* KPI 3 카드 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-rule bg-card p-5"
              aria-hidden
            >
              <div className="skeleton h-2.5 w-20 rounded-full" />
              <div className="skeleton h-7 w-24 rounded-md mt-3" />
              <div className="skeleton h-2.5 w-32 rounded-md mt-2" />
            </div>
          ))}
        </section>

        {/* 차트 + 취약 유형 그리드 */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div
            className="lg:col-span-2 rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5"
            aria-hidden
          >
            <div className="skeleton h-5 w-32 rounded-md" />
            <div className="skeleton h-3 w-2/3 max-w-xs rounded-md mt-2" />
            <div className="skeleton h-[180px] md:h-[240px] w-full rounded-md mt-4" />
          </div>
          <div
            className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5"
            aria-hidden
          >
            <div className="skeleton h-5 w-28 rounded-md" />
            <div className="skeleton h-3 w-2/3 rounded-md mt-2" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="skeleton h-3 w-full rounded-md" />
                  <div className="skeleton h-1 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 활동 히트맵 */}
        <div
          className="rounded-lg border border-rule bg-card p-5"
          aria-hidden
        >
          <div className="flex items-center justify-between">
            <div className="skeleton h-5 w-40 rounded-md" />
            <div className="skeleton h-3 w-24 rounded-md" />
          </div>
          <div className="mt-4 flex gap-1">
            {Array.from({ length: 12 }).map((_, w) => (
              <div key={w} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, d) => (
                  <span
                    key={d}
                    className="skeleton h-2.5 w-2.5 rounded-sm"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
