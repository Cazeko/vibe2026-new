import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { examPapers } from "@/lib/db/schema";
import { safeRun } from "@/lib/db/queries";
import { getPaperItems } from "@/lib/exam-analysis/queries";
import { getSessionLabel } from "@/lib/exam/sessions";
import { getExamPageUrl } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";

export default async function PaperDetailPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { paperId } = await params;

  const paper = await safeRun(
    "paper detail",
    async () => {
      const db = getDb();
      const [row] = await db
        .select()
        .from(examPapers)
        .where(eq(examPapers.id, paperId))
        .limit(1);
      return row ?? null;
    },
    null,
  );

  if (!paper) notFound();

  const items = await getPaperItems(paperId);
  const totalPoints = items.reduce((s, i) => s + (i.points ?? 0), 0);
  const sessionLabel = getSessionLabel(paper.session);

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title={`${paper.year}학년도 ${sessionLabel}`}
        subtitle={`문항 ${items.length}개 · 총점 ${totalPoints}점`}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/exam-analysis?tab=papers">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              기출 시험지로
            </Link>
          </Button>
        }
      />

      <div className="px-6 mx-auto max-w-4xl space-y-4">
        {items.length === 0 ? (
          <EmptyItems />
        ) : (
          <ol className="space-y-4">
            {items.map((item) => (
              <li key={item.id}>
                <ItemCard item={item} />
              </li>
            ))}
          </ol>
        )}

        <p className="text-[10.5px] text-muted-foreground leading-relaxed pt-3">
          본문(stem)은 공개 PDF 원본의 직접 추출본입니다. AI 모범답안·해설은 학습
          참고용이며, 운영자 검수 후 검증 표시됩니다.
        </p>
      </div>
    </div>
  );
}

function ItemCard({
  item,
}: {
  item: Awaited<ReturnType<typeof getPaperItems>>[number];
}) {
  const imageUrl = getExamPageUrl(item.stemImagePath);

  return (
    <Card className="border-rule">
      <CardContent className="p-5">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-lg font-medium tracking-tight tabular-nums">
              {item.itemNo}번
            </span>
            {item.format && (
              <span className="rounded-full border border-rule px-2 py-0.5 text-[10.5px] text-muted-foreground">
                {item.format}
              </span>
            )}
            {item.points != null && (
              <span className="rounded-full border border-rule px-2 py-0.5 text-[10.5px] text-muted-foreground tabular-nums">
                {item.points}점
              </span>
            )}
            {item.bloom && (
              <span className="rounded-full bg-info/10 px-2 py-0.5 text-[10.5px] text-info">
                {item.bloom}
              </span>
            )}
          </div>
          {item.verifiedAnswer ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-1.5 py-0.5 text-[10px] text-info">
              <ShieldCheck className="h-2.5 w-2.5" />
              답안 검증
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">
              <AlertCircle className="h-2.5 w-2.5" />
              답안 검증 필요
            </span>
          )}
        </div>

        {item.domains.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.domains.map((d) => (
              <span
                key={d}
                className="rounded bg-secondary px-1.5 py-0.5 text-[10.5px] text-muted-foreground"
              >
                {d}
              </span>
            ))}
          </div>
        )}

        {imageUrl && (
          <div className="mt-4 overflow-hidden rounded-md border border-rule">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`${item.itemNo}번 본문 이미지`}
              className="w-full"
              loading="lazy"
            />
          </div>
        )}

        {item.stemTextPreview && (
          <p className="mt-3 text-[12.5px] text-foreground/80 leading-relaxed line-clamp-3">
            {item.stemTextPreview}
            {item.stemTextPreview.length >= 80 && "…"}
          </p>
        )}

        {/* 답안·해설 — 기본 접힘. 사용자가 펼쳐서 학습 참고용으로 활용. */}
        {(item.answerMd || item.explanationMd) && (
          <details className="mt-4 group">
            <summary className="cursor-pointer list-none flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors select-none">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-rule text-[10px] group-open:bg-evergreen/10 group-open:border-evergreen group-open:text-evergreen transition-colors">
                +
              </span>
              <span>답안·해설 펼쳐보기</span>
            </summary>
            <div className="mt-4 space-y-4">
              {item.answerMd && (
                <div className="rounded-md border border-evergreen/40 bg-evergreen/[0.04] p-4">
                  <div className="text-[10.5px] uppercase tracking-[0.12em] text-evergreen mb-2">
                    AI 모범답안
                  </div>
                  <div className="font-serif text-[13px] leading-[1.7] whitespace-pre-wrap text-foreground/90">
                    {item.answerMd}
                  </div>
                </div>
              )}
              {item.explanationMd && (
                <div className="rounded-md border border-rule bg-secondary/30 p-4">
                  <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-2">
                    해설
                  </div>
                  <div className="text-[12.5px] leading-[1.7] whitespace-pre-wrap text-foreground/80">
                    {item.explanationMd}
                  </div>
                </div>
              )}
              {!item.verifiedAnswer && (
                <p className="text-[10.5px] text-warning leading-relaxed">
                  ※ 운영자 검수 전 — AI 자동 생성 답안입니다. 학습 참고용으로 활용하세요.
                </p>
              )}
            </div>
          </details>
        )}

        {/* 답안·해설이 아직 시드되지 않은 경우 안내 */}
        {!item.answerMd && !item.explanationMd && (
          <p className="mt-4 text-[11px] text-muted-foreground italic">
            답안·해설이 아직 시드되지 않았습니다.
          </p>
        )}

        {item.keywords.length > 0 && (
          <div className="mt-3 pt-3 border-t border-rule flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              키워드
            </span>
            {item.keywords.map((k) => (
              <span
                key={k}
                className="text-[11px] text-foreground/70"
              >
                {k}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyItems() {
  return (
    <Card className="border-rule border-dashed">
      <CardContent className="p-8 text-center">
        <p className="font-serif text-base font-medium tracking-tight">
          본 시험지의 문항 시드가 아직 적재되지 않았습니다
        </p>
        <p className="mt-2 text-[12.5px] text-muted-foreground leading-relaxed max-w-md mx-auto">
          시드 파이프라인이 적재되면 본 페이지에 자동으로 표시됩니다.
        </p>
      </CardContent>
    </Card>
  );
}
