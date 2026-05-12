import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  Maximize2,
} from "lucide-react";
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
import { Markdown } from "@/components/shared/markdown";

export const dynamic = "force-dynamic";

// 헌법 v3.5 제13조의2·제18조의2 정합 — 시험지 상세 페이지.
// 사용자 보고 2026-05-12 반영:
// - 이미지 우측 잘림 → max-w-full + 가로 스크롤 fallback + 클릭 시 새 탭 전체보기
// - "답안 검증 필요" 반복 → 미검증 다수 시 상단 일괄 안내로 통합, 개별 배지는 톤다운
// - 본문 미리보기 vs 이미지 관계 명확화 (보조 자료 라벨)

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

  // 답안 검증 미통과 문항 비율 — 절반 이상이면 상단에 일괄 안내하고
  // 개별 카드 배지는 톤다운하여 시각 노이즈를 줄인다 (사용자 보고 2026-05-12).
  const unverifiedCount = items.filter((i) => !i.verifiedAnswer).length;
  const unverifiedRatio = items.length > 0 ? unverifiedCount / items.length : 0;
  const showBulkVerifyNotice = unverifiedRatio >= 0.5 && items.length > 0;

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
        {/* 답안 검증 일괄 안내 — 미검증 다수일 때만 노출 */}
        {showBulkVerifyNotice && (
          <aside className="rounded-md border border-warning/40 bg-warning/5 px-4 py-3 flex items-start gap-2.5">
            <AlertCircle
              className="h-4 w-4 text-warning shrink-0 mt-0.5"
              aria-hidden
            />
            <div className="text-[12.5px] text-foreground/85 leading-relaxed">
              <p>
                <strong>답안·해설 검수 진행 중</strong> — 본 시험지의{" "}
                <span className="tabular-nums">{unverifiedCount}/{items.length}</span>
                문항이 운영자 검수 대기 상태입니다.
              </p>
              <p className="mt-1 text-muted-foreground">
                AI 자동 생성 답안이며 학습 참고용으로 활용하세요. 본문(stem)은
                공개 PDF 원본 직접 추출본으로 100% 정확성이 보장됩니다
                (헌법 제13조의2 9항).
              </p>
            </div>
          </aside>
        )}

        {items.length === 0 ? (
          <EmptyItems />
        ) : (
          <ol className="space-y-4">
            {items.map((item) => (
              <li key={item.id}>
                <ItemCard
                  item={item}
                  suppressIndividualBadge={showBulkVerifyNotice}
                />
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
  suppressIndividualBadge,
}: {
  item: Awaited<ReturnType<typeof getPaperItems>>[number];
  suppressIndividualBadge: boolean;
}) {
  const imageUrl = getExamPageUrl(item.stemImagePath);

  return (
    <Card className="border-rule overflow-hidden">
      <CardContent className="p-0">
        <details className="group">
          {/* 헤더 — 항상 노출. 클릭 시 본문·답안 토글. */}
          <summary className="cursor-pointer list-none p-5 flex items-baseline justify-between flex-wrap gap-2 hover:bg-secondary/30 transition-colors select-none">
            <div className="flex items-baseline gap-2 min-w-0">
              <ChevronDown
                className="h-4 w-4 shrink-0 self-center text-muted-foreground -rotate-90 group-open:rotate-0 transition-transform"
                aria-hidden
              />
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
              {(item.domains.length > 0 || item.keywords.length > 0) && (
                <span className="hidden md:inline text-[11.5px] text-muted-foreground/80 truncate max-w-[320px] group-open:hidden">
                  · {[...item.domains.slice(0, 1), ...item.keywords.slice(0, 2)].join(" · ")}
                </span>
              )}
            </div>
            {/* 개별 검증 배지 — 미검증 다수일 때는 상단 일괄 안내로 갈음하고 톤다운 */}
            {item.verifiedAnswer ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-1.5 py-0.5 text-[10px] text-info shrink-0">
                <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                답안 검증
              </span>
            ) : suppressIndividualBadge ? (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground/70 shrink-0"
                title="답안 검수 진행 중 (상단 일괄 안내 참조)"
              >
                <AlertCircle className="h-2.5 w-2.5" aria-hidden />
                검수 중
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning-text shrink-0">
                <AlertCircle className="h-2.5 w-2.5" aria-hidden />
                답안 검증 필요
              </span>
            )}
          </summary>

          {/* 본문 — 펼친 상태에서만 노출. */}
          <div className="px-5 pb-5 pt-1 border-t border-rule">
            {item.domains.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
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

            {imageUrl && <StemImageBlock imageUrl={imageUrl} itemNo={item.itemNo} />}

            {item.stemTextPreview && (
              <div className="mt-3 border-l-4 border-rule pl-3 py-1">
                <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  본문 미리보기 (텍스트 추출본 — 이미지 보조)
                </span>
                <p className="mt-1 text-[12.5px] text-foreground/80 leading-relaxed line-clamp-3">
                  {item.stemTextPreview}
                  {item.stemTextPreview.length >= 80 && "…"}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground/80 leading-snug">
                  본문 원본은 위 이미지를 참고하세요. 미리보기는 검색·키워드
                  태깅용 텍스트 추출본입니다.
                </p>
              </div>
            )}

            {/* 답안·해설 — 중첩 토글. */}
            {(item.answerMd || item.explanationMd) && (
              <details className="mt-4 group/answer">
                <summary className="cursor-pointer list-none flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors select-none">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-rule text-[10px] group-open/answer:bg-evergreen/10 group-open/answer:border-evergreen group-open/answer:text-evergreen transition-colors">
                    +
                  </span>
                  <span>답안·해설 펼쳐보기</span>
                </summary>
                <div className="mt-4 space-y-4">
                  {item.answerMd && (
                    <Card className="border-l-[3px] border-l-evergreen border-y border-r border-rule bg-card">
                      <CardContent className="p-4">
                        <div className="text-[10.5px] uppercase tracking-[0.12em] text-evergreen mb-2">
                          AI 모범답안
                        </div>
                        <Markdown serif>{item.answerMd}</Markdown>
                      </CardContent>
                    </Card>
                  )}
                  {item.explanationMd && (
                    <Card className="border-l-[3px] border-l-info border-y border-r border-rule bg-card">
                      <CardContent className="p-4">
                        <div className="text-[10.5px] uppercase tracking-[0.12em] text-info mb-2">
                          해설
                        </div>
                        <Markdown>{item.explanationMd}</Markdown>
                      </CardContent>
                    </Card>
                  )}
                  {!item.verifiedAnswer && !suppressIndividualBadge && (
                    <p className="text-[10.5px] text-warning-text leading-relaxed">
                      ※ 운영자 검수 전 — AI 자동 생성 답안입니다. 학습 참고용으로 활용하세요.
                    </p>
                  )}
                </div>
              </details>
            )}

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
                  <span key={k} className="text-[11px] text-foreground/70">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

// 원본 시험지 이미지 — max-w-full 보호 + 클릭 시 새 탭 전체보기.
// 이미지가 컨테이너보다 클 경우 가로 스크롤로 자연스럽게 fallback 한다.
function StemImageBlock({
  imageUrl,
  itemNo,
}: {
  imageUrl: string;
  itemNo: number;
}) {
  return (
    <div className="mt-4 rounded-md border border-rule overflow-hidden bg-paper relative group/img">
      <a
        href={imageUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${itemNo}번 본문 이미지 전체보기 (새 탭)`}
        className="block overflow-x-auto"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`${itemNo}번 본문 이미지`}
          className="block max-w-full h-auto mx-auto"
          loading="lazy"
        />
      </a>
      <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1 text-[10px] text-cream backdrop-blur-sm opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
        <Maximize2 className="h-3 w-3" aria-hidden />
        클릭 → 새 탭 전체보기
      </span>
    </div>
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
