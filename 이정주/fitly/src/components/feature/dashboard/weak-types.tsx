import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { WeakType } from "@/lib/dashboard/types";

type Severity = "weak" | "warn" | "ok" | "good";

function severityOf(accuracy: number): Severity {
  if (accuracy < 50) return "weak";
  if (accuracy < 70) return "warn";
  if (accuracy < 80) return "ok";
  return "good";
}

const SEVERITY_LABEL: Record<Severity, string> = {
  weak: "취약",
  warn: "주의",
  ok: "보통",
  good: "양호",
};

const SEVERITY_BAR: Record<Severity, string> = {
  weak: "bg-rose-400",
  warn: "bg-amber-400",
  ok: "bg-sky-400",
  good: "bg-emerald-400",
};

const SEVERITY_BADGE: Record<Severity, string> = {
  weak: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  warn: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  ok: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  good: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
};

export function WeakTypes({ items }: { items: WeakType[] }) {
  return (
    <Card className="rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)] h-full">
      <CardContent className="p-4 h-full">
        <h2 className="text-sm font-bold">취약 유형 분석</h2>

        {items.length === 0 ? (
          <div className="mt-3 grid place-items-center rounded-xl border border-dashed border-border/60 bg-background/50 py-7 text-center text-[11.5px] text-muted-foreground">
            <span className="font-medium text-foreground">아직 분석할 데이터가 없어요</span>
            <Link
              href="/study/exam"
              className="mt-1 text-[10px] text-primary hover:underline"
            >
              기출 풀이로 시작 ›
            </Link>
          </div>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {items.map((w) => {
              const sev = severityOf(w.accuracy);
              return (
                <li key={w.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                      <span className="font-medium text-foreground">
                        {w.label}
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">
                        정답률 {w.accuracy}%
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-px text-[9.5px] font-semibold ${SEVERITY_BADGE[sev]}`}
                      >
                        {SEVERITY_LABEL[sev]}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full ${SEVERITY_BAR[sev]} transition-all`}
                      style={{ width: `${w.accuracy}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
