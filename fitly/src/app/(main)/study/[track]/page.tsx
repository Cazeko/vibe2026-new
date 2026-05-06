import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getDueCards, getDueCardCounts } from "@/lib/db/queries";
import { StudyCardForm } from "./_components/study-card-form";
import type { CardType } from "@/types";

export const dynamic = "force-dynamic";

// 학습 활동 페이지 — 3 트랙(풀이·키워드·오답).

const TRACK_META: Record<
  CardType,
  { title: string; description: string; emptyHint: string }
> = {
  quiz: {
    title: "풀이 트랙",
    description:
      "서술형 기출 답안을 작성하고 AI 모범답안과 비교 후 자가 채점합니다.",
    emptyHint: "새 풀이 카드는 시드가 적재되면 자동 채워집니다.",
  },
  keyword: {
    title: "키워드 트랙",
    description: "개념 정리 노트로 정의·핵심 요소를 반복 학습합니다.",
    emptyHint: "새 키워드 카드는 시드가 적재되면 자동 채워집니다.",
  },
  mistake: {
    title: "오답 트랙",
    description:
      "다시·어렵 평가로 자동 합류된 카드를 마스터까지 복습합니다.",
    emptyHint: "풀이를 다시·어렵으로 평가하면 자동 합류됩니다.",
  },
};

const VALID_TRACKS = ["quiz", "keyword", "mistake"] as const;

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

  const [cards, dueCounts] = await Promise.all([
    getDueCards(user.id, track, 1),
    getDueCardCounts(user.id),
  ]);
  const card = cards[0] ?? null;
  const meta = TRACK_META[track];

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title={meta.title}
        subtitle={meta.description}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/study-plan">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              학습 계획
            </Link>
          </Button>
        }
      />

      <div className="px-6 mx-auto max-w-3xl space-y-6">
        {/* 진행 헤더 — 좌측 due 카운트, 우측 트랙 스위치 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-[12px] text-muted-foreground tabular-nums">
            오늘의 due {" — "}
            <span className="text-foreground font-medium">
              풀이 {dueCounts.quiz}장
            </span>
            {" · "}
            <span className="text-foreground font-medium">
              키워드 {dueCounts.keyword}장
            </span>
            {" · "}
            <span className="text-foreground font-medium">
              오답 {dueCounts.mistake}장
            </span>
          </div>
          <div className="flex items-center gap-1">
            {VALID_TRACKS.map((t) => {
              const active = t === track;
              return (
                <Link
                  key={t}
                  href={`/study/${t}`}
                  className={`px-2.5 py-1 text-[11.5px] rounded-md transition-colors ${
                    active
                      ? "bg-evergreen/10 text-evergreen font-medium"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {TRACK_META[t].title.replace(" 트랙", "")}
                </Link>
              );
            })}
          </div>
        </div>

        {card ? (
          <StudyCardForm
            card={{
              id: card.id,
              type: card.type,
              frontText: card.frontText,
              frontImagePath: card.frontImagePath,
              backMd: card.backMd,
              verifiedAnswer: card.verifiedAnswer,
              paperLabel: card.paperLabel,
              itemFormat: card.itemFormat,
              itemPoints: card.itemPoints,
            }}
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
    <Card className="border-rule border-dashed">
      <CardContent className="p-10 text-center">
        <BookOpenCheck
          className="h-6 w-6 mx-auto text-evergreen"
          aria-hidden
        />
        <p className="mt-3 font-serif text-base font-medium tracking-tight">
          오늘 복습할 카드가 없습니다
        </p>
        <p className="mt-2 text-[12.5px] text-muted-foreground leading-relaxed max-w-md mx-auto">
          {hint}
        </p>

        {altTracks.length > 0 && (
          <div className="mt-5 inline-flex flex-col items-center gap-2">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              다른 트랙
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {altTracks.map((t) => (
                <Button key={t} asChild size="sm" variant="outline">
                  <Link href={`/study/${t}`} prefetch={false}>
                    {TRACK_META[t].title.replace(" 트랙", "")} {dueCounts[t]}장
                    <ArrowRight className="h-3 w-3 ml-1" aria-hidden />
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/study-plan">학습 계획으로</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
