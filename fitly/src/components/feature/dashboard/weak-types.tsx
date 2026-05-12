import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

// 리뷰 H6 fix — warn 배지의 text-warning(#c9a55b on cream ≈2.2:1) → text-warning-text(≈5.1:1).
const SEVERITY_BADGE: Record<Severity, string> = {
  weak: "bg-error/10 text-error",
  warn: "bg-warning/10 text-warning-text",
  ok: "bg-info/10 text-info",
  good: "bg-evergreen/10 text-evergreen",
};

export function WeakTypes({ items }: { items: WeakType[] }) {
  // viewport fit (lg+) — article flex-col + content 영역 flex-1 overflow.
  // 사용자 보고 2026-05-12 — 카드 대비 여백 과다 → padding/spacing 일괄 축소.
  return (
    <article className="rounded-card border border-rule bg-cream-soft px-4 pt-3.5 pb-3 h-full flex flex-col">
      <div className="flex items-center gap-2.5 shrink-0">
        <h2 className="font-sans text-[15px] font-bold tracking-[-0.02em] text-foreground">
          취약 유형 분석
        </h2>
        <Link
          href="/study-analysis"
          className="ml-auto inline-flex items-center gap-0.5 text-[11.5px] text-muted2-deep border-b border-rule-strong pb-px hover:text-evergreen hover:border-evergreen transition-colors"
        >
          자세히 ›
        </Link>
      </div>
      <p className="mt-0.5 mb-2.5 text-[11.5px] text-muted-foreground leading-[1.45] tracking-[-0.005em] shrink-0">
        풀이 50개 이상 누적되면 자동 산출됩니다.
      </p>

      {items.length === 0 ? (
        <div className="flex-1 min-h-0 rounded-[10px] border border-dashed border-rule-strong bg-cream-deep/40 px-4 py-4 flex flex-col items-center justify-center text-center gap-1.5">
          <p className="text-[12.5px] font-semibold text-muted2-deep m-0">
            아직 분석할 데이터가 없어요.
          </p>
          <Link
            href="/study/quiz"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-evergreen border-b border-evergreen pb-px hover:text-evergreen-strong"
          >
            풀이 트랙 시작
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      ) : (
        <ul className="space-y-2 flex-1 min-h-0 overflow-y-auto">
          {items.map((w) => {
            const sev = severityOf(w.accuracy);
            return (
              <li key={w.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-rule-strong" />
                    <span className="font-semibold text-foreground">{w.label}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground num">
                      정답률 {w.accuracy}%
                    </span>
                    <span
                      className={`rounded-md px-1.5 py-px text-[10px] font-bold ${SEVERITY_BADGE[sev]}`}
                    >
                      {SEVERITY_LABEL[sev]}
                    </span>
                  </div>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-cream-deep">
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
    </article>
  );
}
