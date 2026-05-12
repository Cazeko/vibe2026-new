// L1 — 학습 트랙 라우트 스켈레톤 (force-dynamic SSR cold start 방지).
// 명시 근거: docs/audit/2026-05-12-pages-ux-audit.md 페이지 8 L1.
export default function Loading() {
  return (
    <div className="min-h-screen pb-12">
      <header className="px-6 pt-5 pb-3">
        <div className="skeleton h-7 w-40 rounded-md" aria-hidden />
        <div className="skeleton h-3.5 w-72 rounded-md mt-2" aria-hidden />
      </header>

      <div className="px-6 mx-auto max-w-3xl space-y-6">
        {/* 진행 헤더 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="skeleton h-3.5 w-60 rounded-md" aria-hidden />
          <div className="flex gap-2">
            <div className="skeleton h-7 w-14 rounded-md" aria-hidden />
            <div className="skeleton h-7 w-14 rounded-md" aria-hidden />
            <div className="skeleton h-7 w-14 rounded-md" aria-hidden />
          </div>
        </div>

        {/* 카드 본문 스켈레톤 */}
        <div className="rounded-lg border border-rule bg-card p-6 space-y-4" aria-hidden>
          <div className="flex items-center justify-between">
            <div className="skeleton h-3 w-32 rounded-md" />
            <div className="skeleton h-5 w-20 rounded-full" />
          </div>
          <div className="skeleton h-64 w-full rounded-md" />
          <div className="space-y-2">
            <div className="skeleton h-3.5 w-full rounded-md" />
            <div className="skeleton h-3.5 w-11/12 rounded-md" />
            <div className="skeleton h-3.5 w-3/4 rounded-md" />
          </div>
        </div>

        {/* 답안 입력 스켈레톤 */}
        <div className="rounded-lg border border-rule bg-card p-6 space-y-3" aria-hidden>
          <div className="skeleton h-3 w-20 rounded-md" />
          <div className="skeleton h-36 w-full rounded-md" />
          <div className="flex justify-end">
            <div className="skeleton h-9 w-40 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
