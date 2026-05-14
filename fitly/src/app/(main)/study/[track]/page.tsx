import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  ArrowRight,
  ChevronRight,
  Printer,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  getDueCards,
  getDueCardCounts,
  getCardHighlights,
  getCardTags,
} from "@/lib/db/queries";
import { StudyCardForm } from "./_components/study-card-form";
import type { CardType } from "@/types";

export const dynamic = "force-dynamic";

// 학습 활동 페이지 — 3 트랙(풀이·키워드·오답).
// 헌법 §16의2 디자인 시스템 — 학습 본업의 active 표시는 evergreen 인정 범위.

// B1 — "시드" 운영자 용어를 사용자 친화 표현으로 재정의.
// emptyHint는 의미 단위 br(헌법 §4의3) 적용.
const TRACK_META: Record<
  CardType,
  { title: string; description: string; emptyHint: string }
> = {
  quiz: {
    title: "풀이 트랙",
    description:
      "서술형 기출 답안을 작성하고 AI 모범답안과 비교 후 자가 채점합니다.",
    emptyHint:
      "오늘 복습할 풀이 카드가 없습니다.\n새 카드는 시드 일정에 따라 자동 추가됩니다.",
  },
  keyword: {
    title: "키워드 트랙",
    description: "개념 정리 노트로 정의·핵심 요소를 반복 학습합니다.",
    emptyHint:
      "오늘 복습할 키워드 카드가 없습니다.\n새 카드는 시드 일정에 따라 자동 추가됩니다.",
  },
  mistake: {
    title: "오답 트랙",
    description:
      "다시·어렵 평가로 자동 합류된 카드를 마스터까지 반복 학습합니다.",
    emptyHint:
      "오답으로 합류된 카드가 없습니다.\n풀이 트랙에서 다시·어렵을 선택하면\n이 트랙에 자동 합류됩니다.",
  },
};

const VALID_TRACKS = ["quiz", "keyword", "mistake"] as const;

// N1 metadata — 트랙별 동적 타이틀.
// 헌법 §24의2 — 명시 근거: docs/audit/2026-05-12-pages-ux-audit.md 페이지 8.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track } = await params;
  if (!VALID_TRACKS.includes(track as CardType)) {
    return { title: "학습 · Fitly" };
  }
  const meta = TRACK_META[track as CardType];
  return {
    title: `${meta.title} · Fitly`,
    description: meta.description,
  };
}

export default async function StudyTrackPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: trackParam } = await params;
  if (!VALID_TRACKS.includes(trackParam as CardType)) notFound();
  const track = trackParam as CardType;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // O2 병렬 fetch — Promise.all 검증 OK (기존 유지).
  const [cards, dueCounts] = await Promise.all([
    getDueCards(user.id, track, 1),
    getDueCardCounts(user.id),
  ]);
  const card = cards[0] ?? null;
  const meta = TRACK_META[track];

  // 헌법 v3.5.1 제16조 — 카드별 사용자 하이라이트/태그 hydrate.
  // 카드가 없으면 페치 skip (queries.ts safeRun 미호출).
  const [highlights, tags] = card
    ? await Promise.all([
        getCardHighlights(user.id, card.id),
        getCardTags(user.id, card.id),
      ])
    : [[], []];

  return (
    <div className="min-h-screen pb-12">
      {/* v3.6 외부 평가 #3.15 — 브레드크럼 강화 (학습 계획 > 트랙). 현재 트랙
          위치를 명확히 표시하여 사용자가 컨텍스트를 잃지 않도록 한다. */}
      <PageHeader
        title={meta.title}
        subtitle={meta.description}
        actions={
          <nav
            aria-label="현재 위치"
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground"
          >
            <Button asChild variant="ghost" size="sm" className="px-2">
              <Link href="/study-plan">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                학습 계획
              </Link>
            </Button>
            <ChevronRight
              className="h-3 w-3 text-muted-foreground/60"
              aria-hidden
            />
            <span className="font-semibold text-foreground tracking-[-0.01em]">
              {meta.title}
            </span>
          </nav>
        }
      />

      {/* 사용자 발화 (2026-05-14) — quiz/mistake 트랙 가로 여백 과다. 답안 입력
          flow 흐름이라 종전 max-w-3xl 였으나, SplitView 좌우 분할 시 각 영역
          384px 만 확보되어 가로 여백 60%+ 발생. max-w-6xl(1152px) 로 확장하여
          좌우 영역 ~ 560px 씩 확보. keyword 는 단일 컬럼이라 가독성 위해 7xl 유지. */}
      <div
        className={`px-4 sm:px-6 mx-auto space-y-6 ${
          track === "keyword" ? "max-w-7xl" : "max-w-6xl"
        }`}
      >
        {/* D2 — 진행 헤더 flex-wrap + 모바일 stack. S2 큐 상태 변화 aria-live. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="text-[12px] text-muted-foreground tabular-nums leading-relaxed inline-flex items-center gap-1 flex-wrap"
            aria-live="polite"
          >
            <span>오늘의 복습 대기{" — "}</span>
            <span className="text-foreground font-medium">
              풀이 {dueCounts.quiz}장
            </span>
            <span>{" · "}</span>
            <span className="text-foreground font-medium">
              키워드 {dueCounts.keyword}장
            </span>
            <span>{" · "}</span>
            <span className="text-foreground font-medium">
              오답 {dueCounts.mistake}장
            </span>
            {/* 헌법 v3.5.1 제16조 — 오답 트랙 자연스러운 출력 진입점. */}
            {track === "mistake" && (
              <Link
                href="/study/mistake-print"
                className="ml-2 inline-flex items-center gap-1 text-evergreen underline underline-offset-2 hover:text-foreground transition-colors"
              >
                <Printer className="h-3 w-3" aria-hidden />
                오답노트 인쇄
              </Link>
            )}
          </div>
          {/* G2 트랙 스위치 — active border-b-2 evergreen (활성 메뉴 정합).
              v3.6 외부 평가 #3.13 — active indicator 굵기/명도 보강.
              border-b-2 → border-b-[3px], font-medium → font-bold. */}
          <nav
            aria-label="트랙 전환"
            className="flex items-center gap-1 border-b border-rule"
          >
            {VALID_TRACKS.map((t) => {
              const active = t === track;
              return (
                <Link
                  key={t}
                  href={`/study/${t}`}
                  aria-current={active ? "page" : undefined}
                  className={`px-3 py-1.5 text-[11.5px] -mb-px border-b-[3px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 rounded-t-sm ${
                    active
                      ? "border-evergreen text-evergreen font-bold"
                      : "border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  {TRACK_META[t].title.replace(" 트랙", "")}{" "}
                  <span className="tabular-nums text-[10.5px] opacity-80">
                    {dueCounts[t]}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {card ? (
          <StudyCardForm
            card={{
              id: card.id,
              type: card.type,
              frontText: card.frontText,
              frontImagePath: card.frontImagePath,
              frontImagePaths: card.frontImagePaths,
              backMd: card.backMd,
              verifiedAnswer: card.verifiedAnswer,
              paperLabel: card.paperLabel,
              itemFormat: card.itemFormat,
              itemPoints: card.itemPoints,
            }}
            highlights={highlights}
            tags={tags}
          />
        ) : (
          <EmptyQueue track={track} dueCounts={dueCounts} />
        )}
      </div>
    </div>
  );
}

function EmptyQueue({
  track,
  dueCounts,
}: {
  track: CardType;
  dueCounts: { quiz: number; keyword: number; mistake: number };
}) {
  // 다른 트랙에 due가 남아있으면 우선 안내
  const altTracks = (["quiz", "keyword", "mistake"] as const).filter(
    (t) => t !== track && dueCounts[t] > 0,
  );
  const hint = TRACK_META[track].emptyHint;

  return (
    <div className="space-y-4">
      {/* C3 — 다른 트랙에 due가 있으면 상단 강조 배경으로 우선 노출. */}
      {altTracks.length > 0 && (
        <Card className="border-l-[3px] border-l-evergreen border-y border-r border-rule bg-evergreen/5">
          <CardContent className="p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-evergreen">
              지금 바로 학습 가능
            </p>
            <p className="mt-1 text-[12.5px] text-foreground/85 leading-relaxed">
              다른 트랙에 오늘의 복습 카드가 남아 있습니다.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {altTracks.map((t) => (
                <Button key={t} asChild size="sm" variant="outline">
                  <Link href={`/study/${t}`} prefetch={false}>
                    {TRACK_META[t].title.replace(" 트랙", "")}{" "}
                    <span className="tabular-nums ml-1">{dueCounts[t]}장</span>
                    <ArrowRight className="h-3 w-3 ml-1" aria-hidden />
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-rule border-dashed">
        <CardContent className="p-10 text-center">
          {/* P1-04 (외부 리뷰 2026-05-12) — empty state 아이콘을 원형 토큰
              배경으로 시각 강도 증대. 종전 단순 BookOpenCheck 아이콘은 광활한
              empty 카드 중앙에서 시각 무게가 부족. */}
          <span
            aria-hidden
            className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-cream-deep text-muted-foreground"
          >
            <BookOpenCheck className="h-6 w-6" />
          </span>
          <p className="font-serif text-base font-medium tracking-tight">
            오늘 복습할 카드가 없습니다
          </p>
          {/* K1 — emptyHint는 \n으로 의미 단위 분리(헌법 §4의3). whitespace-pre-line으로 렌더. */}
          <p className="mt-2 text-[12.5px] text-muted-foreground leading-relaxed max-w-md mx-auto whitespace-pre-line">
            {hint}
          </p>

          {/* P1-04 — CTA 격상: ghost → outline. ArrowLeft 아이콘으로
              "돌아가기" 시각 어포던스. ghost 는 텍스트만 같아 버튼 인지 약함. */}
          <div className="mt-6">
            <Button asChild variant="outline" size="sm">
              <Link href="/study-plan">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" aria-hidden />
                학습 계획으로 돌아가기
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
