// L1 (헌법 제24조의2 정합) — 대시보드 KPI/차트 스켈레톤
// page.tsx 데이터 fetch 동안 깜빡임 방지. KPI 4매·차트 240px·플랜 row 패턴 정합.
export default function DashboardLoading() {
  return (
    <div className="min-h-screen pb-12">
      {/* DashboardHeader placeholder */}
      <header
        className="flex flex-wrap items-end justify-between gap-3 px-10 pt-6 pb-3"
        aria-hidden
      >
        <div>
          <div className="skeleton h-8 w-44 rounded-md" />
          <div className="skeleton h-3.5 w-72 rounded-md mt-2" />
        </div>
      </header>

      <div className="grid gap-[22px] px-10 py-7">
        {/* KPI 4매 — A1 정합 (md:3 lg:4 단계화) */}
        <section
          aria-hidden
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-card border border-rule bg-cream-soft min-h-[132px] px-[22px] py-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="skeleton h-2.5 w-16 rounded-full" />
                <div className="skeleton h-[30px] w-[30px] rounded-[7px]" />
              </div>
              <div className="skeleton h-9 w-24 rounded-md mt-1" />
              <div className="skeleton h-3 w-32 rounded-md mt-auto" />
            </div>
          ))}
        </section>

        {/* 차트(240px) + 플랜 */}
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[22px]">
          <div
            aria-hidden
            className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5"
          >
            <div className="skeleton h-4 w-32 rounded-md" />
            <div className="skeleton h-[240px] w-full rounded-lg mt-4" />
          </div>
          <div
            aria-hidden
            className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5 space-y-3"
          >
            <div className="skeleton h-4 w-28 rounded-md" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="skeleton h-12 w-full rounded-lg"
              />
            ))}
          </div>
        </section>

        {/* WeakTypes + AI 추천 */}
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_1.05fr] gap-[22px]">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5 space-y-3"
            >
              <div className="skeleton h-4 w-32 rounded-md" />
              <div className="skeleton h-3 w-full rounded-md" />
              <div className="skeleton h-3 w-5/6 rounded-md" />
              <div className="skeleton h-3 w-2/3 rounded-md" />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
