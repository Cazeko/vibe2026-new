import { MobileMenuButton } from "@/components/shared/mobile-menu-button";

type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

// 신규 디자인 topbar 정합 — sticky + cream/95 backdrop + 22px·40px 패딩.
// v3.5.3 — 모바일 햄버거 버튼 통합 (lg:hidden). 모바일 패딩 축소.
// 2026-05-15 — lg+ min-h-[96px] 강제. 사이드바 헤더 (app-sidebar.tsx) 와 동일
// 높이를 가져 가로선이 일자로 정렬되도록 통일. subtitle 유무에 무관히 일관 높이.
export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 sm:gap-4 border-b border-rule bg-cream/95 backdrop-blur px-4 sm:px-6 lg:px-10 py-4 lg:py-[22px] lg:min-h-[96px] mb-4 lg:mb-5">
      <MobileMenuButton />
      <div className="min-w-0">
        <h1 className="font-sans text-[18px] sm:text-[20px] lg:text-[22px] font-bold tracking-[-0.025em] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[12.5px] lg:text-[13.5px] text-muted-foreground leading-[1.5]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="ml-auto flex items-center gap-2 lg:gap-2.5">
          {actions}
        </div>
      )}
    </header>
  );
}
