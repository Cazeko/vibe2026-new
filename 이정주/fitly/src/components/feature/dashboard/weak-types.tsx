import { Card, CardContent } from "@/components/ui/card";
import { WEAK_TYPES } from "@/lib/data/demo-persona";

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
  weak: "bg-rose-50 text-rose-600",
  warn: "bg-amber-50 text-amber-600",
  ok: "bg-sky-50 text-sky-600",
  good: "bg-emerald-50 text-emerald-600",
};

export function WeakTypes() {
  return (
    <Card className="rounded-2xl border-0 shadow-sm h-full">
      <CardContent className="p-5 h-full">
        <h2 className="text-base font-bold">취약 유형 분석</h2>

        <ul className="mt-4 space-y-3">
          {WEAK_TYPES.map((w) => {
            const sev = severityOf(w.accuracy);
            return (
              <li key={w.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    <span className="font-medium text-foreground">
                      {w.label}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      정답률 {w.accuracy}%
                    </span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${SEVERITY_BADGE[sev]}`}
                    >
                      {SEVERITY_LABEL[sev]}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full ${SEVERITY_BAR[sev]} transition-all`}
                    style={{ width: `${w.accuracy}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
