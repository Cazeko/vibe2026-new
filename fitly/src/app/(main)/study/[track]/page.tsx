import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getDueCards, getDueCardCounts } from "@/lib/db/queries";
import { StudyCardForm } from "./_components/study-card-form";
import type { CardType } from "@/types";

export const dynamic = "force-dynamic";

// 헌법 v3.0 제13조의2 — 학습 활동 페이지 (3 트랙: quiz/keyword/mistake).
// 헌법 제36조 우선순위 3·4 — 풀이 본업 + 학습 본업.

const TRACK_META: Record<
  CardType,
  { title: string; description: string }
> = {
  quiz: {
    title: "풀이 트랙",
    description:
      "서술형 기출 답안을 작성하고 AI 모범답안과 비교 후 자가 채점합니다.",
  },
  keyword: {
    title: "키워드 트랙",
    description: "개념 정리 노트를 반복 학습합니다 (객관식 시대 데이터 흡수).",
  },
  mistake: {
    title: "오답 트랙",
    description:
      "again/hard 평가로 자동 합류된 카드를 마스터까지 복습합니다.",
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
          <EmptyQueue />
        )}
      </div>
    </div>
  );
}

function EmptyQueue() {
  return (
    <Card className="border-rule border-dashed">
      <CardContent className="p-10 text-center">
        <BookOpenCheck
          className="h-6 w-6 mx-auto text-evergreen"
          aria-hidden
        />
        <p className="mt-3 font-serif text-base font-medium tracking-tight">
          오늘 due 카드가 없습니다
        </p>
        <p className="mt-2 text-[12.5px] text-muted-foreground leading-relaxed max-w-md mx-auto">
          시드 적재 후 ts-fsrs 일정에 따라 자동으로 채워집니다. 학습 계획에서
          오늘의 분배를 확인하실 수 있습니다.
        </p>
        <Button asChild className="mt-6">
          <Link href="/study-plan">학습 계획으로</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
