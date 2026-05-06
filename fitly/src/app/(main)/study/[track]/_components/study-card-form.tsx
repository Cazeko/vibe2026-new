"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ThumbsUp,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getExamPageUrl } from "@/lib/supabase/storage";
import type { CardType } from "@/types";
import { submitAnswer, gradeCard } from "../actions";

type CardData = {
  id: string;
  type: CardType;
  frontText: string;
  frontImagePath: string | null;
  backMd: string | null;
  verifiedAnswer: boolean;
  paperLabel: string | null;
  itemFormat: string | null;
  itemPoints: number | null;
};

type Grade = "again" | "hard" | "good" | "easy";

const GRADES: {
  key: Grade;
  label: string;
  hint: string;
  tone: string;
  Icon: typeof RefreshCw;
}[] = [
  {
    key: "again",
    label: "다시",
    hint: "1분 후",
    tone: "border-error/40 hover:bg-error/5 text-error",
    Icon: RefreshCw,
  },
  {
    key: "hard",
    label: "어렵",
    hint: "10분 후",
    tone: "border-warning/40 hover:bg-warning/5 text-warning",
    Icon: AlertCircle,
  },
  {
    key: "good",
    label: "좋음",
    hint: "1일 후",
    tone: "border-evergreen/40 hover:bg-evergreen/5 text-evergreen",
    Icon: ThumbsUp,
  },
  {
    key: "easy",
    label: "쉬움",
    hint: "3일 후",
    tone: "border-info/40 hover:bg-info/5 text-info",
    Icon: Zap,
  },
];

export function StudyCardForm({ card }: { card: CardData }) {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(card.type === "keyword");
  const [pending, startTransition] = useTransition();

  const imageUrl = getExamPageUrl(card.frontImagePath);

  function handleReveal() {
    if (card.type === "quiz" || card.type === "mistake") {
      startTransition(async () => {
        if (answer.trim().length > 0) {
          await submitAnswer(card.id, answer);
        }
        setRevealed(true);
      });
    } else {
      setRevealed(true);
    }
  }

  function handleGrade(grade: Grade) {
    startTransition(async () => {
      await gradeCard(card.id, grade);
      setAnswer("");
      setRevealed(card.type === "keyword");
      router.refresh();
    });
  }

  const showAnswerInput =
    !revealed && (card.type === "quiz" || card.type === "mistake");

  return (
    <div className="space-y-5">
      {/* 출처 메타 */}
      <Card className="border-rule">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              출처{" "}
              <span className="ml-2 normal-case tracking-normal text-foreground/85 font-sans">
                {card.paperLabel ?? "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              {card.itemFormat && (
                <Tag>{card.itemFormat}</Tag>
              )}
              {card.itemPoints != null && (
                <Tag>
                  <span className="tabular-nums">{card.itemPoints}</span>점
                </Tag>
              )}
            </div>
          </div>

          {/* 본문 */}
          <div className="mt-6 space-y-4">
            {imageUrl && (
              <div className="overflow-hidden rounded-md border border-rule">
                {/*
                  PNG는 학년도별 가변 비율 + Vercel Image optimization 무료
                  한도(1,000장/월) 초과 시 비용 발생 → 본 시점은 native
                  <img>로 직접 노출. Supabase Storage가 이미 CDN 역할.
                */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="시험 본문 (PDF 페이지)"
                  className="w-full"
                  loading="lazy"
                />
              </div>
            )}
            <p className="font-serif text-[15px] leading-[1.7] whitespace-pre-wrap text-foreground/90">
              {card.frontText}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 답안 입력 (풀이/오답 트랙만) */}
      {showAnswerInput && (
        <Card className="border-rule">
          <CardContent className="p-6">
            <label
              htmlFor="answer"
              className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
            >
              내 답안
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={9}
              className="mt-2 w-full rounded-md border border-rule-strong bg-background px-3.5 py-3 text-[13.5px] leading-[1.7] focus:border-evergreen focus:outline-none focus:ring-2 focus:ring-evergreen/20 resize-y"
              placeholder="답안을 작성해 주세요. 채점 버튼을 누르면 모범답안과 비교됩니다. 답안 작성 없이도 채점은 가능합니다."
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={handleReveal} disabled={pending}>
                {pending ? "처리 중…" : "채점하기 — 답안 보기"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 답안·해설 비교 */}
      {revealed && card.backMd && (
        <Card className="border-evergreen/60 bg-evergreen/[0.04]">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-[0.12em] text-evergreen">
                {card.type === "keyword" ? "정리 노트" : "AI 모범답안"}
              </span>
              <SourceBadge verified={card.verifiedAnswer} />
            </div>
            <div className="mt-4 font-serif text-[14.5px] leading-[1.75] whitespace-pre-wrap text-foreground/90">
              {card.backMd}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 채점이 비공개 카드일 때 */}
      {revealed && !card.backMd && (
        <Card className="border-warning/40 bg-warning/[0.04]">
          <CardContent className="p-6 flex gap-3">
            <AlertCircle
              className="h-5 w-5 text-warning shrink-0 mt-0.5"
              aria-hidden
            />
            <p className="text-[12.5px] text-foreground/80 leading-relaxed">
              본 카드의 답안·해설이 아직 시드되지 않았습니다. 운영자 시드 후 자동
              표시됩니다 (헌법 제30조의2 4계층 출처 모델 정합).
            </p>
          </CardContent>
        </Card>
      )}

      {/* 등급 버튼 */}
      {revealed && (
        <Card className="border-rule">
          <CardContent className="p-6">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              자가 채점 — FSRS 등급
            </p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {GRADES.map(({ key, label, hint, tone, Icon }) => (
                <button
                  key={key}
                  type="button"
                  disabled={pending}
                  onClick={() => handleGrade(key)}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-md border bg-surface px-3 py-3.5 text-[13px] font-medium transition-colors disabled:opacity-50 ${tone}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span>{label}</span>
                  <span className="text-[10.5px] font-normal text-muted-foreground tabular-nums">
                    {hint}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[10.5px] text-muted-foreground leading-relaxed">
              {`"다시"·"어렵"는 다음 학습 시 다시 등장합니다. 풀이 트랙에서 "다시"로 평가하면 오답 트랙에 자동 합류합니다 (헌법 제13조의2 5항).`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-rule px-2 py-0.5 text-muted-foreground">
      {children}
    </span>
  );
}

function SourceBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[10.5px] text-info">
        <CheckCircle2 className="h-3 w-3" />
        검증됨
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10.5px] text-warning">
      <ShieldCheck className="h-3 w-3" />
      검증 필요
    </span>
  );
}
