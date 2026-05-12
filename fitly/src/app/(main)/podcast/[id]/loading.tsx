// L1 헌법 v3.5.1 — 에피소드 상세 스켈레톤. 오디오 메타 깜빡임 방지.
// 헌법 제16조의2 디자인 시스템 — bg-card / border-rule 토큰 정합.

export default function Loading() {
  return (
    <div className="min-h-screen pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3 px-6 pt-5 pb-3">
        <div className="min-w-0 w-full">
          <div className="skeleton h-7 w-2/3 max-w-md rounded-md" />
          <div className="skeleton h-3.5 w-40 rounded-md mt-2" />
        </div>
      </header>

      <div className="px-6 mx-auto max-w-3xl space-y-5">
        <div className="skeleton h-4 w-32 rounded-md" />

        {/* warning/verified 배지 자리 */}
        <div
          className="rounded-lg border-l-[3px] border-l-rule border-y border-r border-rule bg-secondary/30 p-4"
          aria-hidden
        >
          <div className="skeleton h-3 w-full max-w-md rounded-md" />
        </div>

        {/* 오디오 플레이어 자리 */}
        <div
          className="rounded-lg border border-rule bg-card p-5"
          aria-hidden
        >
          <div className="flex items-center gap-3">
            <div className="skeleton h-11 w-11 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="skeleton h-3 w-24 rounded-md" />
              <div className="skeleton h-1.5 w-full rounded-full" />
            </div>
          </div>
        </div>

        {/* 스크립트 영역 */}
        <div className="space-y-3">
          <div className="skeleton h-5 w-24 rounded-md" />
          <div
            className="rounded-lg border border-rule bg-card p-5 space-y-3"
            aria-hidden
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="skeleton h-3 w-10 rounded-md shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-full rounded-md" />
                  <div className="skeleton h-3 w-5/6 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
