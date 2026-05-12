// 헌법 v3.5.1 시행규칙층 — D-S9 운영자 검토 큐 (간이).
// Plan §4.7: Phase 1 끝부분에 간이 페이지로만, 본격 admin 도구는 Phase 2.
// 2026-05-12 추가 다듬기 — tabular-nums, flex-wrap 태그, hover 강조, StatCard
// 색 차별화, 빈 상태 메시지 강화 (헌법 제24조의2 정합).

import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  getReviewQueue,
  getReviewQueueStats,
} from "@/lib/seed-review/queries";
import { getSessionLabel } from "@/lib/exam/sessions";

export const dynamic = "force-dynamic";

// N1 — 운영자 도구는 검색 노출 차단 (robots: noindex)
export const metadata: Metadata = {
  title: "시드 검토 큐 · Fitly Admin",
  description: "AI 생성 답안 운영자 검수 (헌법 제18조의2)",
  robots: { index: false, follow: false },
};

export default async function SeedReviewPage() {
  const [queue, stats] = await Promise.all([
    getReviewQueue(200),
    getReviewQueueStats(),
  ]);

  return (
    <div className="px-8 py-10 max-w-6xl">
      <PageHeader
        title="시드 검토 큐"
        // B3 — 행동 중심 subtitle 재표현
        subtitle="AI가 생성한 모범답안을 검수해 검증 라벨을 부여합니다."
      />

      {/* D1 — StatCard 카드별 배경 차별화 (운영 페이지 정합) */}
      <div className="grid grid-cols-3 gap-4 mb-8 mt-6">
        <StatCard label="전체 문항" value={stats.total} tone="neutral" />
        <StatCard label="검토 대기" value={stats.pending} tone="warning" />
        <StatCard label="검증 완료" value={stats.verified} tone="evergreen" />
      </div>

      {queue.length === 0 ? (
        // D3 — 빈 상태 메시지 강화 (축하 + 아이콘)
        <div className="flex flex-col items-center gap-3 py-16 text-center border border-dashed border-rule rounded-md bg-card">
          <CheckCircle2
            className="h-8 w-8 text-evergreen"
            aria-hidden
          />
          <p className="font-serif text-base font-medium text-foreground">
            모든 항목이 검증되었습니다.
          </p>
          <p className="text-[12.5px] text-muted-foreground">
            새로 시드된 문항이 도착하면 이곳에 표시됩니다.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-md bg-card overflow-hidden">
          {queue.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/seed-review/${row.id}`}
                // G1 — hover shadow + active scale 로 클릭감 강화
                className="block px-5 py-4 transition-all hover:bg-background hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  {/* A1 — tabular-nums 로 숫자 정렬 */}
                  <div className="font-mono text-xs text-muted-foreground tabular-nums">
                    {row.year} {getSessionLabel(row.session)} · {row.itemNo}번
                  </div>
                  {/* D2 — flex-wrap 으로 한 줄 overflow 방지 */}
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {row.format && <Tag>{row.format}</Tag>}
                    {row.bloom && <Tag>{row.bloom}</Tag>}
                    {row.domains.slice(0, 3).map((d) => (
                      <Tag key={d}>{d}</Tag>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm text-foreground/80 line-clamp-2 max-h-[44px]">
                  {row.answerPreview}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type StatTone = "neutral" | "warning" | "evergreen";

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: StatTone;
}) {
  const cls = (() => {
    switch (tone) {
      case "warning":
        return "bg-warning/5 border-warning/30";
      case "evergreen":
        return "bg-evergreen/5 border-evergreen/30";
      default:
        return "bg-secondary/30 border-rule";
    }
  })();
  const numCls =
    tone === "warning"
      ? "text-warning-text"
      : tone === "evergreen"
        ? "text-evergreen"
        : "text-foreground";
  return (
    <div className={`rounded-md border p-5 ${cls}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-serif tabular-nums ${numCls}`}>
        {value.toLocaleString("ko-KR")}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded border border-border text-muted-foreground whitespace-nowrap">
      {children}
    </span>
  );
}
