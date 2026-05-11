import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanItem } from "@/lib/dashboard/types";

export function TodayPlan({ items }: { items: PlanItem[] }) {
  return (
    <article className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5 h-full">
      <div className="flex items-center gap-2.5">
        <h2 className="font-sans text-[17px] font-bold tracking-[-0.02em] text-foreground">
          오늘의 학습 플랜
        </h2>
        <Link
          href="/study-plan"
          className="ml-auto inline-flex items-center gap-0.5 text-[12px] text-muted2-deep border-b border-rule-strong pb-px hover:text-evergreen hover:border-evergreen transition-colors"
        >
          전체 ›
        </Link>
      </div>
      <p className="mt-[2px] mb-[18px] text-[13px] text-muted-foreground leading-[1.5] tracking-[-0.005em]">
        3개 트랙 · 오늘 마감
      </p>

      <ul className="grid gap-2.5">
        {items.map((item) => {
          const completed = item.state === "completed";
          const locked = item.state === "locked";
          return (
            <li key={item.id}>
              <Link
                href={locked ? "#" : item.href}
                aria-disabled={locked}
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
                        ? "border-evergreen bg-evergreen text-white"
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
                  <span
                    className={cn(
                      "font-bold text-[14px] num tracking-[-0.01em]",
                      item.progress > 0 ? "text-evergreen" : "text-muted-foreground"
                    )}
                  >
                    {item.progress}%
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
