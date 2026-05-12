// L1 (헌법 제24조의2 정합) — 학습 계획 스켈레톤.
// 일일 목표 4매·복습 대기 1매·MODES 3매·플랜 진행도·가이드 정합.
export default function StudyPlanLoading() {
  return (
    <div className="min-h-screen pb-10">
      <header
        className="flex flex-wrap items-end justify-between gap-3 px-6 pt-5 pb-3"
        aria-hidden
      >
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
            학습 계획
          </h1>
          <div className="skeleton h-3.5 w-80 rounded-md mt-2" />
        </div>
      </header>

      <div className="px-6 mx-auto max-w-7xl space-y-3">
        {/* 일일 목표 카드 */}
        <div
          aria-hidden
          className="rounded-lg border border-rule bg-card p-5 space-y-3"
        >
          <div className="skeleton h-4 w-44 rounded-md" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-rule bg-background px-3 py-3 space-y-2"
              >
                <div className="skeleton h-2.5 w-12 rounded-full" />
                <div className="skeleton h-7 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* 복습 대기 */}
        <div
          aria-hidden
          className="rounded-lg border border-rule bg-card p-5 space-y-3"
        >
          <div className="skeleton h-2.5 w-28 rounded-full" />
          <div className="skeleton h-9 w-32 rounded-md" />
          <div className="skeleton h-3 w-64 rounded-md" />
        </div>

        {/* MODES 3 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="rounded-lg border border-rule bg-card p-5 space-y-3"
            >
              <div className="skeleton h-11 w-11 rounded-lg" />
              <div className="skeleton h-5 w-28 rounded-md" />
              <div className="skeleton h-3 w-full rounded-md" />
              <div className="skeleton h-3 w-3/4 rounded-md" />
            </div>
          ))}
        </div>

        {/* 플랜 진행도 + 가이드 */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            aria-hidden
            className="rounded-lg border border-rule bg-card p-5 space-y-3"
          >
            <div className="skeleton h-4 w-32 rounded-md" />
            <div className="skeleton h-3 w-full rounded-md" />
            <div className="skeleton h-3 w-5/6 rounded-md" />
            <div className="skeleton h-3 w-2/3 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
