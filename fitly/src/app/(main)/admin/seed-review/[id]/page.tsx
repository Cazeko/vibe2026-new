// 헌법 v3.4 시행규칙층 — D-S9 운영자 검토 상세 (간이).
// 본문(stem_text + stem_image_path)은 v3.3 9항으로 verified_text=true 자동.
// 본 화면은 answer_md / explanation_md 검수 + verified_answer 토글 전용.

import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getReviewItemDetail } from "@/lib/seed-review/queries";
import {
  markAnswerVerified,
  unmarkAnswerVerified,
} from "@/lib/seed-review/actions";

export const dynamic = "force-dynamic";

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

  return (
    <div className="px-8 py-10 max-w-5xl">
      <Link
        href="/admin/seed-review"
        className="text-xs text-app-muted hover:text-app-fg"
      >
        ← 검토 큐로
      </Link>

      <PageHeader
        title={`${item.year} ${labelOfSession(item.session)} · ${item.itemNo}번`}
        subtitle={`format: ${item.format ?? "?"} · bloom: ${item.bloom ?? "?"} · 배점: ${item.points ?? "?"}점`}
      />

      <Section title="검증 상태">
        <div className="flex gap-3 text-sm">
          <Badge label="본문" verified={item.verifiedText} />
          <Badge label="답안" verified={item.verifiedAnswer} />
        </div>
        <p className="mt-2 text-xs text-app-muted">
          본문은 PDF 원본 직접 사용으로 자동 검증됩니다. 답안은 AI 생성이므로 운영자 검수가 필요합니다.
        </p>
      </Section>

      <Section title="문제 본문 (PDF 원본)">
        <div className="rounded-md border border-app-line bg-app-surface p-5 whitespace-pre-wrap text-sm text-app-fg/90 font-mono">
          {item.stemText || "(stem_text 없음 — stemImagePath PNG 참조)"}
        </div>
        {item.stemImagePath && (
          <p className="mt-2 text-xs text-app-muted font-mono">
            이미지 경로: {item.stemImagePath}
          </p>
        )}
      </Section>

      <Section title="태깅 (LLM 생성)">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <KV k="영역" v={item.domains.join(", ")} />
          <KV k="키워드" v={item.keywords.join(", ")} />
        </div>
      </Section>

      <Section title="모범답안 (LLM 생성, 검증 필요)">
        <div className="rounded-md border border-app-line bg-app-surface p-5 whitespace-pre-wrap text-sm">
          {item.answerMd ?? "(답안 없음)"}
        </div>
      </Section>

      <Section title="해설 (LLM 생성)">
        <div className="rounded-md border border-app-line bg-app-surface p-5 whitespace-pre-wrap text-sm">
          {item.explanationMd ?? "(해설 없음)"}
        </div>
      </Section>

      <Section title="검수 액션">
        {item.verifiedAnswer ? (
          <form action={unverify}>
            <Button type="submit" variant="ghost">
              검증 해제
            </Button>
          </form>
        ) : (
          <form action={verify}>
            <Button type="submit">검증 완료로 표시</Button>
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
      <h2 className="text-sm font-medium text-app-muted mb-3">{title}</h2>
      {children}
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-app-muted">{k}</div>
      <div className="mt-1 text-app-fg">{v || "—"}</div>
    </div>
  );
}

function Badge({ label, verified }: { label: string; verified: boolean }) {
  return (
    <span
      className={
        "px-3 py-1 rounded-full text-xs border " +
        (verified
          ? "border-app-accent text-app-accent"
          : "border-app-line text-app-muted")
      }
    >
      {label} {verified ? "✓ 검증" : "검증 필요"}
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
