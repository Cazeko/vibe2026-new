import { AppSidebar } from "@/components/shared/app-sidebar";
import { PageTransition } from "@/components/shared/page-transition";
import { MobileMenuProvider } from "@/components/shared/mobile-menu-provider";
import { PodcastPlayerProvider } from "@/components/shared/podcast-player-provider";
import { PodcastMiniPlayer } from "@/components/shared/podcast-mini-player";
import { ProfileProvider } from "@/components/shared/profile-provider";
import { getCurrentUserProfile } from "@/lib/user/profile";

// 헌법 v3.5 제35조의2 정합 — Vercel function 한도.
// statement_timeout 8s + safeRun fallback과 함께 SSR 전체 한도를 30s로 확장하여
// /me 같이 query 다발 페이지가 cold start RTT 누적으로 10s 기본 한도에 걸리는
// 패턴 방지. preferredRegion=icn1로 한국 사용자→Supabase 서울 RTT 최소화.
export const maxDuration = 30;
export const preferredRegion = "icn1";

// 헌법 v3.5.3 제2조 — 모바일 1차 지원. AppSidebar 가 lg 미만에서는 drawer 로
// 동작하며 (MobileMenuProvider 컨텍스트), TabletGate 는 폐지됨.
//
// 코드리뷰 B.H2/H3 (2026-05-15 PR-8) — profile 을 본 layout 에서 SSR 1회 조회한 뒤
// ProfileProvider 로 자식 client 트리에 전달. 종전 sidebar/header/settings 가
// 각자 `/api/user/profile` 을 fetch 하던 페이지당 2~3회 중복 호출 회귀 차단.
export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentUserProfile();
  return (
    <ProfileProvider profile={profile}>
      <MobileMenuProvider>
        <PodcastPlayerProvider>
          <div className="min-h-screen">
            <AppSidebar />
            {/* v3.5.2 (2026-05-14) — 사이드바 토글 통합 + 폭 슬림화 (248→188px).
                `--sidebar-w` (globals.css) 가 html[data-sidebar] 에 따라 188/0 토글.
                lg+ 만 pl 적용, lg 미만은 drawer 모델로 main pl 영향 X.
                Track 1.2 — 미니플레이어 sticky 시 pb 동적. */}
            <main
              className="min-h-screen lg:pl-[var(--sidebar-w,188px)] transition-[padding-left] duration-200"
              style={{ paddingBottom: "calc(var(--mini-player-h, 0px) + 16px)" }}
            >
              <PageTransition>{children}</PageTransition>
            </main>
            <PodcastMiniPlayer />
          </div>
        </PodcastPlayerProvider>
      </MobileMenuProvider>
    </ProfileProvider>
  );
}
