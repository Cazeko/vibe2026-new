import { LoginHero } from "@/components/feature/auth/login-hero";

// (auth) 그룹 공통 레이아웃 — 좌측 hero(공책 + 만년필 글쓰기) + 우측 form 카드.
// 데스크톱(≥1024px): 좌우 분할. 모바일: 상하 (hero 30vh + form 자연 높이).
// 디자인 plan: docs/plans/2026-05-06-login-landing-design.md
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* 좌측 hero — 데스크톱 60%, 모바일 30vh */}
      <div className="relative h-[30vh] lg:h-auto lg:flex-1 lg:basis-3/5 border-b lg:border-b-0 lg:border-r border-rule">
        <LoginHero />
      </div>

      {/* 우측 form 영역 — 데스크톱 40%, 모바일 자연 높이 */}
      <div className="lg:basis-2/5 lg:max-w-[520px] flex items-center justify-center px-6 py-10 lg:py-16">
        {children}
      </div>
    </div>
  );
}
