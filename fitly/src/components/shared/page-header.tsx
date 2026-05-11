type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

// 신규 디자인 topbar 정합 — sticky + cream/95 backdrop + 22px·40px 패딩
export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-4 border-b border-rule bg-cream/95 backdrop-blur px-10 py-[22px]">
      <div className="min-w-0">
        <h1 className="font-sans text-[22px] font-bold tracking-[-0.025em] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[13.5px] text-muted-foreground leading-[1.5]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="ml-auto flex items-center gap-2.5">{actions}</div>}
    </header>
  );
}
