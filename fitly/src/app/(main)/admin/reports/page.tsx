// 헌법 시행규칙 33 §35 백업 매트릭스 — 운영자 신고 큐 (PR-7, 2026-05-15).
// PR-6 에서 도입한 사용자 신고 채널의 운영자 측 검토 페이지.
// 디자인 패턴은 `/admin/seed-review` 와 정합 (StatCard·Tag 구조 재사용).

import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  getReportQueue,
  getReportStats,
  formatReportCategory,
} from "@/lib/seed-review/report-queries";
import {
  markReportReviewed,
  markReportDismissed,
} from "@/lib/seed-review/actions";
import type { CardReportStatus } from "@/lib/db/schema/card-reports";
import { ReportSubmitButton } from "./_components/report-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "사용자 신고 큐 · Fitly Admin",
  description: "사용자가 보고한 AI 답안 오류 검토 (헌법 시행규칙 33 §35)",
  robots: { index: false, follow: false },
};

const TABS: Array<{ key: CardReportStatus; label: string }> = [
  { key: "pending", label: "검토 대기" },
  { key: "reviewed", label: "검토 완료" },
  { key: "dismissed", label: "기각" },
];

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const status: CardReportStatus =
    params.status === "reviewed"
      ? "reviewed"
      : params.status === "dismissed"
        ? "dismissed"
        : "pending";

  const [rows, stats] = await Promise.all([
    getReportQueue(status, 200),
    getReportStats(),
  ]);

  async function reviewAction(formData: FormData) {
    "use server";
    const id = formData.get("id");
    if (typeof id !== "string") return;
    await markReportReviewed(id);
  }

  async function dismissAction(formData: FormData) {
    "use server";
    const id = formData.get("id");
    if (typeof id !== "string") return;
    await markReportDismissed(id);
  }

  return (
    <div className="px-8 py-10 max-w-6xl">
      <PageHeader
        title="사용자 신고 큐"
        subtitle="학습자가 보고한 AI 답안·해설 오류를 검토합니다."
      />

      <div className="grid grid-cols-3 gap-4 mb-6 mt-6">
        <StatCard label="검토 대기" value={stats.pending} tone="warning" />
        <StatCard label="검토 완료" value={stats.reviewed} tone="evergreen" />
        <StatCard label="기각" value={stats.dismissed} tone="neutral" />
      </div>

      <nav
        className="mb-4 flex gap-1 border-b border-rule"
        aria-label="신고 상태 필터"
      >
        {TABS.map((tab) => {
          const active = status === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/admin/reports?status=${tab.key}`}
              className={
                active
                  ? "inline-flex h-9 items-center border-b-2 border-evergreen px-3 text-[12.5px] font-semibold text-evergreen"
                  : "inline-flex h-9 items-center border-b-2 border-transparent px-3 text-[12.5px] text-muted-foreground hover:text-foreground"
              }
              aria-current={active ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center border border-dashed border-rule rounded-md bg-card">
          <CheckCircle2 className="h-8 w-8 text-evergreen" aria-hidden />
          <p className="font-serif text-base font-medium text-foreground">
            {status === "pending"
              ? "검토 대기 중인 신고가 없습니다."
              : status === "reviewed"
                ? "검토 완료된 신고가 없습니다."
                : "기각된 신고가 없습니다."}
          </p>
          <p className="text-[12.5px] text-muted-foreground">
            신고가 도착하면 이곳에 표시됩니다.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-md bg-card overflow-hidden">
          {rows.map((row) => (
            <li key={row.id} className="px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 mb-2">
                <div className="flex items-center gap-2 text-[12px]">
                  <Tag tone="warning">{formatReportCategory(row.category)}</Tag>
                  {row.paperLabel && (
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      {row.paperLabel}
                      {row.itemNo != null ? ` · ${row.itemNo}번` : ""}
                    </span>
                  )}
                  {row.cardType && <Tag>{row.cardType}</Tag>}
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {row.createdAt.toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {row.cardFrontText && (
                <p className="text-[12px] text-muted-foreground line-clamp-2 mb-1">
                  본문: {row.cardFrontText}
                </p>
              )}
              <p className="text-[12.5px] text-foreground/85 line-clamp-2 mb-1">
                모범답안: {row.cardBackPreview}
              </p>
              {row.detail && (
                <p className="mt-2 rounded-md border-l-2 border-warning/40 bg-warning/5 px-3 py-2 text-[12.5px] text-foreground/85 whitespace-pre-wrap">
                  {row.detail}
                </p>
              )}

              {status === "pending" ? (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/seed-review/${row.cardId}`}
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-rule px-3 text-[12px] font-medium text-muted-foreground hover:bg-secondary/60"
                  >
                    카드 보기
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                  <div className="flex items-center gap-2">
                    <form action={dismissAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <ReportSubmitButton tone="dismissed">기각</ReportSubmitButton>
                    </form>
                    <form action={reviewAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <ReportSubmitButton tone="reviewed">검토 완료</ReportSubmitButton>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <Link
                    href={`/admin/seed-review/${row.cardId}`}
                    className="hover:underline"
                  >
                    카드 보기 →
                  </Link>
                  {row.reviewedAt && (
                    <span className="tabular-nums">
                      처리 {row.reviewedAt.toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              )}
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
  const cls =
    tone === "warning"
      ? "bg-warning/5 border-warning/30"
      : tone === "evergreen"
        ? "bg-evergreen/5 border-evergreen/30"
        : "bg-secondary/30 border-rule";
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

function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warning";
}) {
  const cls =
    tone === "warning"
      ? "border-warning/30 bg-warning/10 text-warning-text"
      : "border-border text-muted-foreground";
  return (
    <span
      className={`inline-flex h-5 items-center px-2 rounded border ${cls} whitespace-nowrap text-[11px]`}
    >
      {children}
    </span>
  );
}
