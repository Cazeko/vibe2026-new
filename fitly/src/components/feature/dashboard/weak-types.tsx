import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
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
        // v3.5.6·v3.6 외부 리뷰 #2.5 — empty state 시각 강화.
        // SearchX 원형 토큰 + 블러 더미 차트 배경 (v3.6 신설) — "잠금 해제 욕구"
        // 자극. dummy bar 들은 opacity 25% + blur(2px) 로 *데이터가 곧 채워질 것
        // 같은* 시각 단서. §4.3 evergreen 보호 — bar 색은 muted-foreground 단조.
        // 2026-05-18 — 빈 상태 dashed placeholder 가 flex-1 + min-h-0 으로
        // viewport-fit 미활성 구간에서 거의 0 으로 수축, AiRecommend 옆 카드
        // 높이에 종속되며 위치가 들쑥날쑥. min-h floor 200px 으로 안정화,
        // 2xl viewport-fit 활성 시 min-h-0 으로 해제하여 flex 분배 정합.
        <div className="relative flex-1 min-h-[200px] 2xl:min-h-0 rounded-[10px] border border-dashed border-rule-strong bg-cream-deep/40 px-4 py-4 flex flex-col items-center justify-center text-center gap-1.5 overflow-hidden">
          {/* 블러 처리된 더미 bar 차트 — 데이터 들어찰 자리 시각화 */}
          <div
            aria-hidden
            className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2 opacity-25 pointer-events-none"
            style={{ filter: "blur(2px)" }}
          >
            {[55, 80, 35, 65, 45].map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-t bg-muted-foreground/60"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <span
            aria-hidden
            className="relative grid h-9 w-9 place-items-center rounded-full bg-cream text-muted-foreground mb-0.5"
          >
            <SearchX className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </span>
          <p className="relative text-[12.5px] font-semibold text-muted2-deep m-0">
            아직 분석할 데이터가 없어요.
          </p>
          <p className="relative text-[11px] text-muted-foreground leading-[1.4] break-keep max-w-[16rem]">
            풀이 트랙을 5회 이상 진행하시면
            AI 가 영역별 취약 유형을 자동 분석해 드립니다.
          </p>
          <Link
            href="/study/quiz"
            className="relative mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-evergreen border-b border-evergreen pb-px hover:text-evergreen-strong"
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
