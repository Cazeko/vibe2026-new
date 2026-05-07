// 헌법 v3.4 시행규칙층 — D-S9 운영자 검토 큐 (간이).
// Plan §4.7: Phase 1 끝부분에 간이 페이지로만, 본격 admin 도구는 Phase 2.

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import {
  getReviewQueue,
  getReviewQueueStats,
} from "@/lib/seed-review/queries";
import { getSessionLabel } from "@/lib/exam/sessions";

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
        subtitle={`AI 생성 답안의 운영자 검수`}
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="전체 문항" value={stats.total} />
        <StatCard label="검토 대기" value={stats.pending} highlight />
        <StatCard label="검증 완료" value={stats.verified} />
      </div>

      {queue.length === 0 ? (
        <div className="text-muted-foreground text-sm py-12 text-center">
          모든 항목이 검증되었습니다.
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-md bg-card">
          {queue.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/seed-review/${row.id}`}
                className="block px-5 py-4 hover:bg-background transition-colors"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div className="font-mono text-xs text-muted-foreground">
                    {row.year} {getSessionLabel(row.session)} · {row.itemNo}번
                  </div>
                  <div className="flex gap-2 text-[11px]">
                    {row.format && <Tag>{row.format}</Tag>}
                    {row.bloom && <Tag>{row.bloom}</Tag>}
                    {row.domains.slice(0, 3).map((d) => (
                      <Tag key={d}>{d}</Tag>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm text-foreground/80 line-clamp-2">
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
        "rounded-md border border-border p-5 " +
        (highlight ? "bg-evergreen/5" : "bg-card")
      }
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={
          "mt-1 text-2xl font-serif " +
          (highlight ? "text-evergreen" : "text-foreground")
        }
      >
        {value.toLocaleString("ko-KR")}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded border border-border text-muted-foreground">
      {children}
    </span>
  );
}

