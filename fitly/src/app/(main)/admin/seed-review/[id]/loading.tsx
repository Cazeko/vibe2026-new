// admin/seed-review/[id] loading.tsx — 검수 상세 폴백.
// answerMd·explanationMd 마크다운 렌더 비용이 있어 별도 로딩 노출 가치 있음.

export default function Loading() {
  return (
    <div className="px-8 py-10 max-w-5xl" aria-busy="true" aria-live="polite">
      <div className="skeleton h-3 w-24 rounded-md" />
      <div className="mt-4 space-y-2">
        <div className="skeleton h-7 w-72 rounded-md" />
        <div className="skeleton h-4 w-80 rounded-md" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <section className="mt-8" key={i} aria-hidden>
          <div className="skeleton h-3.5 w-28 rounded-md mb-3" />
          <div className="rounded-md border border-rule bg-card p-5 space-y-2">
            <div className="skeleton h-3 w-full rounded-md" />
            <div className="skeleton h-3 w-5/6 rounded-md" />
            <div className="skeleton h-3 w-4/6 rounded-md" />
          </div>
        </section>
      ))}
      <span className="sr-only">검수 상세를 불러오는 중입니다.</span>
    </div>
  );
}
