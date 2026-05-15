import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { examPapers } from "@/lib/db/schema";
import { safeRun } from "@/lib/db/queries";
import { getPaperItems } from "@/lib/exam-analysis/queries";
import { getSessionLabel } from "@/lib/exam/sessions";
import { ItemCard } from "./_components/item-card";

export const dynamic = "force-dynamic";

// title.absolute — 루트 layout.tsx 의 template "%s · Fitly" 우회.
// 브라우저 인쇄 → PDF 저장 시 파일명을 "Fitly {YYYY학년도 회차}" 로 통일.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;
  const paper = await safeRun(
    "paper detail metadata",
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
  if (!paper) return { title: { absolute: "Fitly 기출분석" } };
  const sessionLabel = getSessionLabel(paper.session);
  return {
    title: { absolute: `Fitly ${paper.year}학년도 ${sessionLabel}` },
  };
}

// 헌법 v3.5 제13조의2·제18조의2 정합 — 시험지 상세 페이지.
// 백승환 검토자 피드백 (2026-05-13) 반영
// #4 본문 텍스트 전체 보기 — Lightbox 텍스트 모드 + "전체 텍스트 보기" 버튼
// #5 학습 뷰어 — 새 탭 → 서비스 내부 모달 (ExamItemLightbox)
// #6 zoom + 분할 보기 — Lightbox 안 4단계 줌 + 이미지/텍스트 split 모드
// #8 검수 카피 분리 — 상단 가변 안내 + 하단 불변 출처/검수 정책 footer

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
  const paperLabel = `${paper.year}학년도 ${sessionLabel}`;

  const unverifiedCount = items.filter((i) => !i.verifiedAnswer).length;
  const unverifiedRatio = items.length > 0 ? unverifiedCount / items.length : 0;
  const showBulkVerifyNotice = unverifiedRatio >= 0.5 && items.length > 0;

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title={paperLabel}
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
        {/* 백승환 피드백 #8 — 검수 안내(상단, 가변) vs 정확성 보장(하단, 불변) 분리. */}
        {showBulkVerifyNotice && (
          <aside className="rounded-md border border-warning/40 bg-warning/5 px-4 py-3 flex items-start gap-2.5">
            <AlertCircle
              className="h-4 w-4 text-warning shrink-0 mt-0.5"
              aria-hidden
            />
            <div className="text-[12.5px] text-foreground/85 leading-relaxed break-keep">
              <p>
                <strong>답안·해설은 검수 전 — 참고용으로만 활용해 주세요</strong>
              </p>
              <p className="mt-1 text-muted-foreground">
                <span className="tabular-nums">{unverifiedCount}/{items.length}</span>
                문항이 운영자 검수 대기 상태입니다. AI 자동 생성 답안이며,
                검증 완료 시 각 문항 우측에 검증 배지가 표시됩니다.
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
                  paperLabel={paperLabel}
                  suppressIndividualBadge={showBulkVerifyNotice}
                />
              </li>
            ))}
          </ol>
        )}

        <footer className="rounded-md border border-rule bg-secondary/20 px-4 py-3 mt-3 text-[10.5px] text-muted-foreground leading-relaxed break-keep">
          <p>
            <strong className="text-foreground/85">본문(stem)</strong> ·
            공개 PDF 원본의 직접 추출본 (헌법 제13조의2 9항).
          </p>
          <p className="mt-1">
            <strong className="text-foreground/85">답안·해설</strong> ·
            AI 자동 생성. 검증 배지가 표시된 문항은 운영자 검수 통과,
            그 외는 학습 참고용.
          </p>
        </footer>
      </div>
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
