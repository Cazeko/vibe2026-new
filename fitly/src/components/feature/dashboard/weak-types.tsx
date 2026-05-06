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

// DESIGN.md §4.4 — semantic 색은 desaturated 토큰으로. 채도 충돌 회피 + 단계 인식 가능.
const SEVERITY_BAR: Record<Severity, string> = {
  weak: "bg-error/70",
  warn: "bg-warning/70",
  ok: "bg-info/70",
  good: "bg-evergreen/70",
};

const SEVERITY_BADGE: Record<Severity, string> = {
  weak: "bg-error/10 text-error",
  warn: "bg-warning/10 text-warning",
  ok: "bg-info/10 text-info",
  good: "bg-evergreen/10 text-evergreen",
};

export function WeakTypes({ items }: { items: WeakType[] }) {
  return (
    <Card className="border-rule h-full">
      <CardContent className="p-5 h-full">
        <h2 className="font-serif text-lg font-medium tracking-tight">
          취약 유형 분석
        </h2>

        {items.length === 0 ? (
          <div className="mt-3 grid place-items-center rounded-lg border border-dashed border-rule bg-background/50 py-7 text-center text-[11.5px] text-muted-foreground">
            <span className="font-medium text-foreground">아직 분석할 데이터가 없어요</span>
            <Link
              href="/study/quiz"
              className="mt-1 text-[10px] text-evergreen hover:underline"
            >
              풀이 트랙 시작 ›
            </Link>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
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
                      <span className="text-muted-foreground num">
                        정답률 {w.accuracy}%
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-px text-[9.5px] font-semibold ${SEVERITY_BADGE[sev]}`}
                      >
                        {SEVERITY_LABEL[sev]}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-rule">
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
