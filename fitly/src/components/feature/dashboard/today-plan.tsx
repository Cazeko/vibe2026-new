import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanItem } from "@/lib/dashboard/types";

export function TodayPlan({ items }: { items: PlanItem[] }) {
  // viewport fit (lg+) — article flex-col + ul flex-1 overflow-y-auto.
  return (
    <article className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5 lg:px-5 lg:pt-4 lg:pb-3 h-full flex flex-col">
      <div className="flex items-center gap-2.5 shrink-0">
        <h2 className="font-sans text-[17px] lg:text-[15px] font-bold tracking-[-0.02em] text-foreground">
          오늘의 학습 플랜
        </h2>
        <Link
          href="/study-plan"
          className="ml-auto inline-flex items-center gap-0.5 text-[12px] text-muted2-deep border-b border-rule-strong pb-px hover:text-evergreen hover:border-evergreen transition-colors"
        >
          전체 ›
        </Link>
      </div>
      <p className="mt-[2px] mb-[18px] lg:mb-2.5 text-[13px] lg:text-[11.5px] text-muted-foreground leading-[1.5] tracking-[-0.005em] shrink-0">
        3개 트랙 · 오늘 마감
      </p>

      <ul className="grid gap-2.5 lg:gap-2 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
        {items.map((item) => {
          const completed = item.state === "completed";
          const locked = item.state === "locked";
          // 코드리뷰 M20 (2026-05-15) — locked 행은 anchor 가 아닌 div 로 렌더.
          // 종전 `<Link href="#" aria-disabled>` 는 키보드/스크린리더에서 여전히
          // 활성 링크로 인식되어 `#` 으로 이동·history push 회귀가 있었음.
          const RowTag = locked ? "div" : Link;
          const rowProps = locked
            ? ({ "aria-disabled": true } as Record<string, unknown>)
            : { href: item.href };
          return (
            <li key={item.id}>
              <RowTag
                {...(rowProps as { href: string })}
                className={cn(
                  "grid grid-cols-[22px_1fr_auto] items-center gap-3 rounded-[10px] border px-3.5 py-3 transition-colors",
                  locked
                    ? "opacity-70 border-dashed border-rule-strong cursor-not-allowed bg-transparent"
                    : "bg-cream border-rule hover:border-rule-strong"
                )}
              >
                {locked ? (
                  <span className="grid h-[18px] w-[18px] place-items-center text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" aria-hidden />
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className={cn(
                      "grid h-[18px] w-[18px] place-items-center rounded-full border-[1.5px] transition-all",
                      completed
                        ? "border-evergreen bg-evergreen text-primary-foreground"
                        : "border-rule-strong bg-transparent text-transparent"
                    )}
                  >
                    {completed && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  </span>
                )}
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[14px] font-semibold leading-tight tracking-[-0.02em] truncate",
                      locked ? "text-muted2-deep font-medium" : "text-foreground"
                    )}
                  >
                    {item.title}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[12px] tracking-[-0.005em] truncate flex items-center gap-1.5",
                      locked ? "text-muted-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {item.subtitle}
                  </p>
                </div>
                {!locked && (
                  /* v3.7 외부 평가 #2.3 — 원형 프로그레스 ring. conic-gradient 로
                     evergreen 차오름. SVG 대신 CSS 만으로 구현 (light bundle).
                     §7 모션 절제 정합 — transition 700ms ease-out (gauge-fill 정합). */
                  <span
                    className="relative inline-flex h-9 w-9 items-center justify-center shrink-0"
                    aria-label={`진척도 ${item.progress}%`}
                    role="progressbar"
                    aria-valuenow={item.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full transition-[background] duration-700"
                      style={{
                        background: `conic-gradient(hsl(var(--color-accent)) ${item.progress * 3.6}deg, hsl(var(--color-rule)) 0)`,
                      }}
                    />
                    <span
                      aria-hidden
                      className="absolute inset-[3px] rounded-full bg-cream-soft"
                    />
                    <span
                      className={cn(
                        "relative font-bold text-[10.5px] num tracking-[-0.01em] leading-none",
                        item.progress > 0
                          ? "text-evergreen"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.progress}
                    </span>
                  </span>
                )}
              </RowTag>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
