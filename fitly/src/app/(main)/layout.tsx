import { AppSidebar } from "@/components/shared/app-sidebar";
import { TabletGate } from "@/components/shared/tablet-gate";
import { PageTransition } from "@/components/shared/page-transition";

// 헌법 v3.5 제35조의2 정합 — Vercel function 한도.
// statement_timeout 8s + safeRun fallback과 함께 SSR 전체 한도를 30s로 확장하여
// /me 같이 query 다발 페이지가 cold start RTT 누적으로 10s 기본 한도에 걸리는
// 패턴 방지. preferredRegion=icn1로 한국 사용자→Supabase 서울 RTT 최소화.
export const maxDuration = 30;
export const preferredRegion = "icn1";

// 헌법 v1.9 제13조 — 태블릿 가로 사이드바 + 콘텐츠 그리드.
export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <TabletGate />
      {/* DESIGN.md §4.5 정합 — body 자체의 cream + 1% radial grain 이 그대로 비친다.
          이 div 에 bg-app-bg 를 두면 그레인이 가려져 로그인 페이지에만 노출되는
          이전 회귀가 재현된다. 따라서 색을 명시하지 아니한다. */}
      <div className="hidden lg:block min-h-screen">
        <AppSidebar />
        {/* P2-02 (외부 리뷰 2026-05-12) — 페이지 전환 fade-up 트랜지션.
            DESIGN §7.1 진입 200ms ease-out 정합, prefers-reduced-motion 존중. */}
        <main className="ml-[248px] min-h-screen">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </>
  );
}
