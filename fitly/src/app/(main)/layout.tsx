import { AppSidebar } from "@/components/shared/app-sidebar";
import { PageTransition } from "@/components/shared/page-transition";
import { MobileMenuProvider } from "@/components/shared/mobile-menu-provider";
import { PodcastPlayerProvider } from "@/components/shared/podcast-player-provider";
import { PodcastMiniPlayer } from "@/components/shared/podcast-mini-player";

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
      <PodcastPlayerProvider>
        <div className="min-h-screen">
          <AppSidebar />
          {/* lg+ 에서는 사이드바 폭 248px offset, 모바일에서는 fullwidth.
              DESIGN.md §4.5 — body cream + 1% grain 그대로.
              Track 1.2 (v3.5.4) — 활성 팟캐스트 에피소드가 있을 때 미니플레이어가
              하단에 sticky 노출. main 영역 하단 패딩으로 가림 회피.
              리뷰 H2 fix — pb 를 `--mini-player-h` (활성 시 76px, 비활성 0px) +
              16px 기본 여백으로 동적 계산. 미니플레이어 닫으면 자동 축소. */}
          <main
            className="lg:ml-[248px] min-h-screen"
            style={{ paddingBottom: "calc(var(--mini-player-h, 0px) + 16px)" }}
          >
            <PageTransition>{children}</PageTransition>
          </main>
          <PodcastMiniPlayer />
        </div>
      </PodcastPlayerProvider>
    </MobileMenuProvider>
  );
}
