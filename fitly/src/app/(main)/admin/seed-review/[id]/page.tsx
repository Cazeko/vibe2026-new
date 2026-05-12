// 헌법 v3.5.1 시행규칙층 — D-S9 운영자 검토 상세 (간이).
// 본문(stem_text + stem_image_path)은 v3.3 9항으로 verified_text=true 자동.
// 본 화면은 answer_md / explanation_md 검수 + verified_answer 토글 전용.
// 2026-05-12 다듬기 (헌법 v3.5.1) — P0: Markdown 적용 (제13조의2 9항 정합),
// 이미지 프리뷰, useFormStatus 로딩, alert-info, Badge 차별화.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Info } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Markdown } from "@/components/shared/markdown";
import { getReviewItemDetail } from "@/lib/seed-review/queries";
import {
  markAnswerVerified,
  unmarkAnswerVerified,
} from "@/lib/seed-review/actions";
import { getSessionLabel } from "@/lib/exam/sessions";
import { VerifySubmitButton } from "./_components/verify-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "시드 검수 상세 · Fitly Admin",
  description: "AI 생성 답안 운영자 검수 상세",
  robots: { index: false, follow: false },
};

export default async function SeedReviewItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getReviewItemDetail(id);
  if (!item) return notFound();

  const verify = markAnswerVerified.bind(null, item.id);
  const unverify = unmarkAnswerVerified.bind(null, item.id);

  // B1 — subtitle 풀어 표시 (기술적 → 사용자 친화)
  const subtitleParts = [
    item.format ? `형식 ${item.format}` : null,
    item.bloom ? `인지수준 ${item.bloom}` : null,
    item.points ? `배점 ${item.points}점` : "배점 미정",
  ].filter(Boolean);

  return (
    <div className="px-8 py-10 max-w-5xl pb-20">
      <Link
        href="/admin/seed-review"
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 rounded px-1 py-0.5"
      >
        ← 검토 큐로
      </Link>

      <PageHeader
        title={`${item.year} ${getSessionLabel(item.session)} · ${item.itemNo}번`}
        subtitle={subtitleParts.join(" · ")}
      />

      <Section title="검증 상태">
        <div className="flex gap-3 text-sm flex-wrap">
          <Badge label="본문" verified={item.verifiedText} />
          <Badge label="답안" verified={item.verifiedAnswer} />
        </div>
        {/* B3 — PDF 자동 검증 안내를 alert-info 박스로 강조 */}
        <div className="mt-3 flex items-start gap-2 rounded-md bg-info/5 border border-info/30 px-3.5 py-2.5 text-[12.5px] text-info leading-[1.6]">
          <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
          <span>
            본문은 PDF 원본 직접 사용으로 자동 검증됩니다.
            <br />
            답안은 AI 생성이므로 운영자 검수가 필요합니다.
          </span>
        </div>
      </Section>

      <Section title="문제 본문 (PDF 원본)">
        <div className="rounded-md border border-border bg-card p-5 whitespace-pre-wrap text-sm text-foreground/90 font-mono">
          {/* C1 — 사용자 친화 폴백 */}
          {item.stemText || "(텍스트 없음 — 아래 이미지 참조)"}
        </div>
        {item.stemImagePath && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground font-mono">
              이미지 경로: {item.stemImagePath}
            </p>
            {/* E3 — stemImagePath 프리뷰 (max-h 300px) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.stemImagePath}
              alt={`${item.year} ${getSessionLabel(item.session)} ${item.itemNo}번 본문 이미지`}
              className="max-h-[300px] max-w-full h-auto rounded-md border border-rule bg-card"
              loading="lazy"
            />
          </div>
        )}
      </Section>

      <Section title="태깅 (LLM 생성)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm items-start">
          <KV k="영역" v={item.domains.join(", ")} />
          <KV k="키워드" v={item.keywords.join(", ")} />
        </div>
      </Section>

      <Section title="모범답안 (LLM 생성, 검증 필요)">
        {/* F1 P0 — Markdown 렌더 적용 (헌법 제13조의2 9항 정합) */}
        <div className="rounded-md border border-border bg-card p-5">
          {item.answerMd ? (
            <Markdown>{item.answerMd}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">(답안 없음)</p>
          )}
        </div>
      </Section>

      <Section title="해설 (LLM 생성)">
        <div className="rounded-md border border-border bg-card p-5">
          {item.explanationMd ? (
            <Markdown>{item.explanationMd}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">(해설 없음)</p>
          )}
        </div>
      </Section>

      <Section title="검수 액션">
        {item.verifiedAnswer ? (
          <form action={unverify}>
            <VerifySubmitButton variant="ghost">검증 해제</VerifySubmitButton>
          </form>
        ) : (
          <form action={verify}>
            <VerifySubmitButton>검증 완료로 표시</VerifySubmitButton>
          </form>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-muted-foreground mb-3">{title}</h2>
      {children}
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="mt-1 text-foreground break-words">{v || "—"}</div>
    </div>
  );
}

function Badge({ label, verified }: { label: string; verified: boolean }) {
  // D1 — verified true 시 evergreen 보더+배경 차별화
  return (
    <span
      className={
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border " +
        (verified
          ? "border-evergreen text-evergreen bg-evergreen/5"
          : "border-border text-muted-foreground bg-secondary/30")
      }
    >
      {label}
      {verified ? (
        <>
          <CheckCircle2 className="h-3 w-3" aria-hidden />
          검증
        </>
      ) : (
        " · 검토 필요"
      )}
    </span>
  );
}
