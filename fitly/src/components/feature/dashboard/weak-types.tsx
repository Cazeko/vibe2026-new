import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { WeakType } from "@/lib/dashboard/types";

// SEVERITY_BAR 제거 (B004) — Severity type 은 BADGE/LABEL에서 계속 사용.
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

// DESIGN.md §4.4 — 진척 바는 단일 단색. 차별은 우측 SEVERITY_BADGE 라벨로만.
// §4.3 — evergreen은 진척도 KPI / Primary CTA / 활성 사이드바 / AI 추천 / 잉크 trail
// 6 위치 한정. weak-types 진척 바는 6 위치 외 — bg-foreground/40 단색 통일 (B004).
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
              className="mt-1 text-[10px] text-foreground underline underline-offset-2 hover:text-evergreen"
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
                      className="h-full bg-foreground/40 transition-all"
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
