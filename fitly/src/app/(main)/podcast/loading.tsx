// L1 헌법 v3.5.1 — Next.js 15 route streaming. 카드 스켈레톤으로 빈 화면 응시 방지.
// 헌법 제16조의2 디자인 시스템 — bg-card / border-rule 토큰 정합.

export default function Loading() {
  return (
    <div className="min-h-screen pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3 px-6 pt-5 pb-3">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
            팟캐스트
          </h1>
          <div className="skeleton h-3.5 w-72 rounded-md mt-2" />
        </div>
      </header>

      <div className="px-6 mx-auto max-w-7xl space-y-8">
        {/* KPI 3 카드 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-rule bg-card p-5"
              aria-hidden
            >
              <div className="skeleton h-2.5 w-20 rounded-full" />
              <div className="skeleton h-8 w-28 rounded-md mt-3" />
            </div>
          ))}
        </section>

        {/* 즉석 생성 진입 카드 */}
        <div
          className="rounded-lg border border-evergreen bg-evergreen/[0.04] p-4 md:p-6 space-y-2"
          aria-hidden
        >
          <div className="skeleton h-4 w-40 rounded-md" />
          <div className="skeleton h-3 w-full max-w-md rounded-md" />
        </div>

        {/* 에피소드 그리드 — 카드 6개 */}
        {Array.from({ length: 2 }).map((_, sec) => (
          <section key={sec} className="space-y-4">
            <div className="skeleton h-5 w-32 rounded-md" />
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-rule bg-card p-5 space-y-3"
                  aria-hidden
                >
                  <div className="skeleton h-2.5 w-24 rounded-full" />
                  <div className="skeleton h-4 w-5/6 rounded-md" />
                  <div className="skeleton h-4 w-2/3 rounded-md" />
                  <div className="skeleton h-3 w-16 rounded-md mt-3" />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
