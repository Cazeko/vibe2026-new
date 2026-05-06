import { AppSidebar } from "@/components/shared/app-sidebar";
import { TabletGate } from "@/components/shared/tablet-gate";

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
      <div className="hidden lg:block min-h-screen bg-app-bg">
        <AppSidebar />
        <main className="ml-56 min-h-screen">{children}</main>
      </div>
    </>
  );
}
