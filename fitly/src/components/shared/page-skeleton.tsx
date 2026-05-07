// SSR cold start 시 force-dynamic 페이지의 빈 화면 응시 방지.
// 각 라우트의 loading.tsx에서 import해 일관된 skeleton 노출.
// globals.css의 .skeleton 유틸(shimmer 애니메이션)을 활용한다.

export function PageSkeleton({
  title,
  rows = 3,
}: {
  title?: string;
  rows?: number;
}) {
  return (
    <div className="min-h-screen pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3 px-6 pt-5 pb-3">
        <div>
          {title ? (
            <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
              {title}
            </h1>
          ) : (
            <div className="skeleton h-8 w-48 rounded-md" />
          )}
          <div className="skeleton h-3.5 w-72 rounded-md mt-2" />
        </div>
      </header>

      <div className="px-6 mx-auto max-w-7xl space-y-4">
        {/* KPI 줄 */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-rule bg-card p-5"
              aria-hidden
            >
              <div className="skeleton h-2.5 w-20 rounded-full" />
              <div className="skeleton h-8 w-24 rounded-md mt-3" />
            </div>
          ))}
        </section>

        {/* 본문 row */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-rule bg-card p-5 space-y-3"
            aria-hidden
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
