// L1 (헌법 제24조의2 정합) — 마이 페이지 스켈레톤.
// 프로필 1매·3 트랙 통계·히트맵·최근 활동·배지 6매 패턴 정합.
export default function MeLoading() {
  return (
    <div className="min-h-screen pb-12">
      <header
        className="flex flex-wrap items-end justify-between gap-3 px-4 sm:px-6 lg:px-10 pt-5 lg:pt-6 pb-3"
        aria-hidden
      >
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
            마이 페이지
          </h1>
          <div className="skeleton h-3.5 w-80 rounded-md mt-2" />
        </div>
      </header>

      <div className="grid gap-[18px] sm:gap-[22px] px-4 sm:px-6 lg:px-10 py-5 lg:py-7">
        {/* 프로필 카드 */}
        <div
          aria-hidden
          className="rounded-card border border-rule bg-cream-soft px-6 py-[22px] flex items-center gap-5 flex-wrap"
        >
          <div className="skeleton h-16 w-16 rounded-[14px]" />
          <div className="flex-1 min-w-[200px] space-y-2">
            <div className="skeleton h-5 w-64 rounded-md" />
            <div className="skeleton h-3.5 w-48 rounded-md" />
          </div>
          <div className="inline-flex gap-2.5">
            <div className="skeleton h-10 w-28 rounded-lg" />
            <div className="skeleton h-10 w-28 rounded-lg" />
          </div>
        </div>

        {/* 3 트랙 통계 */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="rounded-card border border-rule bg-cream-soft px-[22px] py-5 space-y-3"
            >
              <div className="skeleton h-4 w-24 rounded-md" />
              <div className="skeleton h-10 w-28 rounded-md" />
              <div className="skeleton h-3 w-full rounded-md" />
            </div>
          ))}
        </section>

        {/* 히트맵 + 최근 활동 */}
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[22px]">
          <div
            aria-hidden
            className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5 space-y-3"
          >
            <div className="skeleton h-4 w-28 rounded-md" />
            <div className="skeleton h-3 w-72 rounded-md" />
            <div className="skeleton h-[88px] w-full rounded-lg" />
          </div>
          <div
            aria-hidden
            className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5 space-y-3"
          >
            <div className="skeleton h-4 w-24 rounded-md" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full rounded-lg" />
            ))}
          </div>
        </section>

        {/* 배지 */}
        <div
          aria-hidden
          className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5 space-y-3"
        >
          <div className="skeleton h-4 w-24 rounded-md" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[12px] border border-rule bg-cream px-3 pt-[18px] pb-3.5 space-y-2 text-center"
              >
                <div className="skeleton mx-auto h-9 w-9 rounded-full" />
                <div className="skeleton mx-auto h-3 w-16 rounded-md" />
                <div className="skeleton mx-auto h-2.5 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
