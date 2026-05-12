// (auth) 그룹 loading.tsx — 로그인/회원가입 폼 스켈레톤.
// FitlySignIn 의 좌우 분할 레이아웃 톤을 유지해 깜빡임 최소화.

export default function Loading() {
  return (
    <main
      className="grid min-h-screen grid-cols-1 md:grid-cols-2"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Hero (데스크톱 우측) — evergreen 배경 톤만 유지 */}
      <section
        aria-hidden
        className="relative overflow-hidden bg-evergreen md:order-2 px-7 md:px-10 lg:px-[72px] py-10 md:py-16"
      >
        <div className="space-y-6 max-w-[460px]">
          <div className="skeleton h-3 w-28 rounded-md bg-cream/20" />
          <div className="skeleton h-12 w-full rounded-md bg-cream/20" />
          <div className="skeleton h-12 w-5/6 rounded-md bg-cream/20" />
          <div className="skeleton h-4 w-3/4 rounded-md bg-cream/20" />
        </div>
      </section>

      {/* Login (데스크톱 좌측) — 폼 스켈레톤 */}
      <section className="bg-background flex flex-col justify-center items-center px-7 md:px-10 lg:px-12 py-14 md:py-24 md:order-1">
        <div className="w-full max-w-[420px] space-y-4">
          <div className="skeleton h-3 w-16 rounded-full" />
          <div className="skeleton h-9 w-3/4 rounded-md" />
          <div className="skeleton h-4 w-5/6 rounded-md" />
          <div className="mt-9 space-y-3.5">
            <div className="skeleton h-[52px] w-full rounded-lg" />
            <div className="skeleton h-[52px] w-full rounded-lg" />
            <div className="skeleton h-[52px] w-full rounded-md mt-2" />
            <div className="skeleton h-[52px] w-full rounded-md" />
          </div>
          <div className="skeleton h-14 w-full rounded-lg mt-6" />
        </div>
        <span className="sr-only">로그인 화면을 불러오는 중입니다.</span>
      </section>
    </main>
  );
}
