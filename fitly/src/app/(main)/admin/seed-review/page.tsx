// 헌법 v3.4 시행규칙층 — D-S9 운영자 검토 큐 (간이).
// Plan §4.7: Phase 1 끝부분에 간이 페이지로만, 본격 admin 도구는 Phase 2.

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import {
  getReviewQueue,
  getReviewQueueStats,
} from "@/lib/seed-review/queries";

export const dynamic = "force-dynamic";

export default async function SeedReviewPage() {
  const [queue, stats] = await Promise.all([
    getReviewQueue(200),
    getReviewQueueStats(),
  ]);

  return (
    <div className="px-8 py-10 max-w-6xl">
      <PageHeader
        title="시드 검토 큐"
        subtitle={`AI 생성 답안의 운영자 검수 (헌법 제18조의2 · v3.3 9항 정합)`}
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="전체 문항" value={stats.total} />
        <StatCard label="검토 대기" value={stats.pending} highlight />
        <StatCard label="검증 완료" value={stats.verified} />
      </div>

      {queue.length === 0 ? (
        <div className="text-app-muted text-sm py-12 text-center">
          모든 항목이 검증되었습니다.
        </div>
      ) : (
        <ul className="divide-y divide-app-line border border-app-line rounded-md bg-app-surface">
          {queue.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/seed-review/${row.id}`}
                className="block px-5 py-4 hover:bg-app-bg transition-colors"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div className="font-mono text-xs text-app-muted">
                    {row.year} {labelOfSession(row.session)} · {row.itemNo}번
                  </div>
                  <div className="flex gap-2 text-[11px]">
                    {row.format && <Tag>{row.format}</Tag>}
                    {row.bloom && <Tag>{row.bloom}</Tag>}
                    {row.domains.slice(0, 3).map((d) => (
                      <Tag key={d}>{d}</Tag>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm text-app-fg/80 line-clamp-2">
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

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-md border border-app-line p-5 " +
        (highlight ? "bg-app-accent/5" : "bg-app-surface")
      }
    >
      <div className="text-xs text-app-muted">{label}</div>
      <div
        className={
          "mt-1 text-2xl font-serif " +
          (highlight ? "text-app-accent" : "text-app-fg")
        }
      >
        {value.toLocaleString("ko-KR")}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded border border-app-line text-app-muted">
      {children}
    </span>
  );
}

function labelOfSession(s: string): string {
  return (
    { essay: "교직논술", A: "교육과정 A", B: "교육과정 B", combined: "통합본" }[
      s
    ] ?? s
  );
}
