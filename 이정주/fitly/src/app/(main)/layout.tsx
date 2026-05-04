import { AppSidebar } from "@/components/shared/app-sidebar";
import { TabletGate } from "@/components/shared/tablet-gate";

// 헌법 v1.9 제13조 — 태블릿 가로 사이드바 + 콘텐츠 그리드.
export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <TabletGate />
      <div className="hidden lg:block min-h-screen bg-[#f4f6fb]">
        <AppSidebar />
        <main className="ml-60 min-h-screen">{children}</main>
      </div>
    </>
  );
}
