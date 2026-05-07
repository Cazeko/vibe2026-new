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
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/shared/markdown";
import { useStudySession } from "@/lib/hooks/use-study-session";
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
  const { recordCard } = useStudySession(card.type);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(card.type === "keyword");
  const [stemExpanded, setStemExpanded] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [pending, startTransition] = useTransition();

  const imageUrl = getExamPageUrl(card.frontImagePath);
  // 본문은 PDF unpdf 추출본이라 줄바꿈·공백이 raw하게 들어 있다. whitespace-pre-wrap
  // 으로 표시하되 너무 길면(800자 이상) 기본 접힘 + "본문 펼쳐보기" 토글.
  const isLongStem = card.frontText.length > 800;

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
    const isCorrect = grade !== "again";
    recordCard(isCorrect);
    setSessionCount((c) => c + 1);
    startTransition(async () => {
      await gradeCard(card.id, grade);
      setAnswer("");
      setRevealed(card.type === "keyword");
      setStemExpanded(false);
      router.refresh();
    });
  }

  const showAnswerInput =
    !revealed && (card.type === "quiz" || card.type === "mistake");

  return (
    <div className="space-y-5">
      {/* 세션 진행 — 학습한 카드 수를 시각적으로 누적 표시. */}
      {sessionCount > 0 && (
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="uppercase tracking-[0.12em]">세션 진행</span>
          <span className="tabular-nums font-medium text-foreground">
            {sessionCount}장 학습
          </span>
          <div className="flex-1 h-1 bg-rule rounded-full overflow-hidden">
            <div
              className="h-full bg-evergreen transition-all duration-500"
              style={{ width: `${Math.min(100, sessionCount * 8)}%` }}
            />
          </div>
        </div>
      )}

      {/* 출처 메타 + 본문 */}
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
              {card.itemFormat && <Tag>{card.itemFormat}</Tag>}
              {card.itemPoints != null && (
                <Tag>
                  <span className="tabular-nums">{card.itemPoints}</span>점
                </Tag>
              )}
            </div>
          </div>

          {/* PDF 페이지 이미지 — 가독성의 1차. 텍스트는 보조. */}
          {imageUrl && (
            <div className="mt-5 overflow-hidden rounded-md border border-rule">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="시험 본문 (PDF 페이지)"
                className="w-full"
                loading="lazy"
              />
            </div>
          )}

          {/* 텍스트 본문 — 길면 접힘. unpdf 추출본은 raw text라 검색·낭독 보조 목적. */}
          {card.frontText && (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  본문 텍스트{imageUrl && " (검색·낭독 보조)"}
                </span>
                {isLongStem && (
                  <button
                    type="button"
                    onClick={() => setStemExpanded((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {stemExpanded ? (
                      <>
                        <EyeOff className="h-3 w-3" aria-hidden />
                        접기
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" aria-hidden />
                        펼치기
                      </>
                    )}
                  </button>
                )}
              </div>
              <div
                className={`border-l-4 border-rule pl-4 pr-1 py-1 ${
                  isLongStem && !stemExpanded
                    ? "max-h-[180px] overflow-hidden relative"
                    : ""
                }`}
              >
                <p className="font-serif text-[14px] leading-[1.7] whitespace-pre-wrap text-foreground/85">
                  {card.frontText}
                </p>
                {isLongStem && !stemExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                )}
              </div>
            </div>
          )}
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

      {/* 답안 비교 — quiz/mistake은 좌우, keyword은 단독 */}
      {revealed && card.backMd && (
        <>
          {(card.type === "quiz" || card.type === "mistake") && answer.trim().length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnswerBox label="내 답안" tone="muted" plainText={answer} />
              <AnswerBox
                label="AI 모범답안"
                tone="evergreen"
                markdown={card.backMd}
                verified={card.verifiedAnswer}
              />
            </div>
          ) : (
            <AnswerBox
              label={card.type === "keyword" ? "정리 노트" : "AI 모범답안"}
              tone="evergreen"
              markdown={card.backMd}
              verified={card.verifiedAnswer}
            />
          )}
        </>
      )}

      {revealed && !card.backMd && (
        <Card className="border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30">
          <CardContent className="p-6 flex gap-3">
            <AlertCircle
              className="h-5 w-5 text-warning shrink-0 mt-0.5"
              aria-hidden
            />
            <p className="text-[12.5px] text-foreground/80 leading-relaxed">
              본 카드의 답안·해설이 아직 시드되지 않았습니다. 운영자 시드 후 자동
              표시됩니다.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 등급 버튼 */}
      {revealed && (
        <Card className="border-rule">
          <CardContent className="p-6">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              자가 채점 — 복습 등급
            </p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {GRADES.map(({ key, label, hint, tone, Icon }) => (
                <button
                  key={key}
                  type="button"
                  disabled={pending}
                  onClick={() => handleGrade(key)}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-md border bg-card px-3 py-3.5 text-[13px] font-medium transition-colors disabled:opacity-50 ${tone}`}
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
              {`"다시"·"어렵"는 다음 학습 시 다시 등장합니다. 풀이 트랙에서 "다시"로 평가하면 오답 트랙에 자동 합류합니다.`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnswerBox({
  label,
  tone,
  markdown,
  plainText,
  verified,
}: {
  label: string;
  tone: "evergreen" | "muted";
  markdown?: string | null;
  plainText?: string;
  verified?: boolean;
}) {
  // 단단한 bg-card로 body 종이 그레인을 가린다. 차별화 시그널은 좌측 4px
  // 보더 + uppercase 라벨로 충분 (alpha tone은 가독성 저하).
  const toneClass =
    tone === "evergreen"
      ? "border-l-4 border-evergreen"
      : "border-l-4 border-rule-strong";
  const labelClass =
    tone === "evergreen" ? "text-evergreen" : "text-muted-foreground";

  return (
    <Card className={`${toneClass} border-y border-r border-rule bg-card`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10.5px] uppercase tracking-[0.12em] ${labelClass}`}
          >
            {label}
          </span>
          {verified !== undefined && <SourceBadge verified={verified} />}
        </div>
        <div className="mt-3">
          {markdown ? (
            <Markdown serif>{markdown}</Markdown>
          ) : (
            <div className="font-sans text-[13.5px] leading-[1.75] whitespace-pre-wrap text-foreground/90">
              {plainText || "—"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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
