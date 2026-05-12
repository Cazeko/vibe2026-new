import { AppSidebar } from "@/components/shared/app-sidebar";
import { PageTransition } from "@/components/shared/page-transition";
import { MobileMenuProvider } from "@/components/shared/mobile-menu-provider";

// 헌법 v3.5 제35조의2 정합 — Vercel function 한도.
// statement_timeout 8s + safeRun fallback과 함께 SSR 전체 한도를 30s로 확장하여
// /me 같이 query 다발 페이지가 cold start RTT 누적으로 10s 기본 한도에 걸리는
// 패턴 방지. preferredRegion=icn1로 한국 사용자→Supabase 서울 RTT 최소화.
export const maxDuration = 30;
export const preferredRegion = "icn1";

// 헌법 v3.5.3 제2조 — 모바일 1차 지원. AppSidebar 가 lg 미만에서는 drawer 로
// 동작하며 (MobileMenuProvider 컨텍스트), TabletGate 는 폐지됨.
export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <MobileMenuProvider>
      <div className="min-h-screen">
        <AppSidebar />
        {/* lg+ 에서는 사이드바 폭 248px offset, 모바일에서는 fullwidth.
            DESIGN.md §4.5 — body cream + 1% grain 그대로. */}
        <main className="lg:ml-[248px] min-h-screen">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </MobileMenuProvider>
  );
}
