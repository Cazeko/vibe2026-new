// admin 라우트 그룹 loading.tsx — 검토 큐·상세 공통 폴백.
// (main)/error.tsx 가 상위에 있으나 loading 은 라우트 단위로 가깝게 둔다.

export default function Loading() {
  return (
    <div className="px-8 py-10 max-w-6xl" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <div className="skeleton h-7 w-48 rounded-md" />
        <div className="skeleton h-4 w-80 rounded-md" />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-8 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-rule bg-card p-5"
            aria-hidden
          >
            <div className="skeleton h-3 w-16 rounded-full" />
            <div className="skeleton h-7 w-20 rounded-md mt-3" />
          </div>
        ))}
      </div>
      <div className="border border-rule rounded-md bg-card divide-y divide-rule">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-4 space-y-2" aria-hidden>
            <div className="flex items-center justify-between gap-4">
              <div className="skeleton h-3 w-40 rounded-md" />
              <div className="skeleton h-4 w-32 rounded-md" />
            </div>
            <div className="skeleton h-3 w-full rounded-md" />
            <div className="skeleton h-3 w-4/5 rounded-md" />
          </div>
        ))}
      </div>
      <span className="sr-only">검토 큐를 불러오는 중입니다.</span>
    </div>
  );
}
