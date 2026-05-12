"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  Maximize2,
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
  // I1 — 답안 보기 후 비교 영역으로 스크롤하기 위한 ref.
  const answerCompareRef = useRef<HTMLDivElement | null>(null);

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

  // I1 — 답안 공개 시 비교 영역으로 부드럽게 스크롤.
  useEffect(() => {
    if (revealed && answerCompareRef.current) {
      answerCompareRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [revealed]);

  // S1 — 키보드 단축키 1/2/3/4 자가 채점 (revealed 상태에서만, textarea/input 포커스 제외).
  useEffect(() => {
    if (!revealed) return;
    function onKey(e: KeyboardEvent) {
      const tgt = e.target as HTMLElement | null;
      const tag = tgt?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tgt?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const map: Record<string, Grade> = {
        "1": "again",
        "2": "hard",
        "3": "good",
        "4": "easy",
      };
      const g = map[e.key];
      if (g && !pending) {
        e.preventDefault();
        handleGrade(g);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, pending]);

  // C1 — sessionCount 진행바 100% clamp 명확화 (12+ 카드 시 동일 폭 유지).
  const sessionProgressPct = Math.min(100, sessionCount * 8);

  return (
    <div className="space-y-5">
      {/* 세션 진행 — 학습한 카드 수를 시각적으로 누적 표시. S1 aria-live 정합. */}
      {sessionCount > 0 && (
        <div
          className="flex items-center gap-3 text-[11px] text-muted-foreground"
          aria-live="polite"
        >
          <span className="uppercase tracking-[0.12em]">세션 진행</span>
          <span className="tabular-nums font-medium text-foreground">
            {sessionCount}장 학습
          </span>
          <div
            className="flex-1 h-1 bg-rule rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={sessionProgressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="세션 진행률"
          >
            <div
              className="h-full bg-evergreen transition-all duration-500"
              style={{ width: `${sessionProgressPct}%` }}
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

          {/* E2 — PDF 이미지 클릭 시 새 탭 전체보기 (exam-analysis 패턴 정합).
              헌법 §16 스코프 보호 — lightbox modal 신규 도입 보류, 새 탭으로 대체.
              O1 — width/height 명시(CLS 방지) + lazy loading. */}
          {imageUrl && (
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="시험 본문 이미지 새 탭에서 전체 크기로 보기"
              className="mt-5 group relative block overflow-hidden rounded-md border border-rule focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="시험 본문 (PDF 페이지)"
                className="w-full"
                loading="lazy"
                width={1240}
                height={1754}
              />
              <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-[10.5px] text-foreground/80 border border-rule opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                <Maximize2 className="h-3 w-3" aria-hidden />
                전체보기
              </span>
            </a>
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
                {/* A1 — fade height 50px 이상으로 확장, 텍스트 겹침 방지. */}
                {isLongStem && !stemExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-card via-card/90 to-transparent pointer-events-none" />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 답안 입력 (풀이/오답 트랙만) — J2 label htmlFor 연결 OK, J1 focus ring 강화. */}
      {showAnswerInput && (
        <Card className="border-rule">
          <CardContent className="p-6">
            <label
              htmlFor="answer-input"
              className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground cursor-pointer"
            >
              내 답안
            </label>
            <textarea
              id="answer-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={9}
              // J1 focus ring 강화 + K1 placeholder 50자 이내 단축 + 의미 단위 \n.
              className="mt-2 w-full rounded-md border border-rule-strong bg-background px-3.5 py-3 text-[13.5px] leading-[1.7] resize-y focus:border-evergreen focus:outline-none focus:ring-2 focus:ring-evergreen/40 transition-colors"
              placeholder={"답안을 작성해 주세요.\n비워두고 채점도 가능합니다."}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={handleReveal} disabled={pending}>
                {pending ? "처리 중…" : "채점하기 — 답안 보기"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 답안 비교 — quiz/mistake은 좌우, keyword은 단독. I1 auto-scroll target. */}
      {revealed && card.backMd && (
        <div ref={answerCompareRef} className="scroll-mt-4">
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
        </div>
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

      {/* 등급 버튼 — G1 톤별 hover bg, Q1 44px 보장, S1 키보드 단축키 1/2/3/4. */}
      {revealed && (
        <Card className="border-rule">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                자가 채점 — 복습 등급
              </p>
              <p className="hidden sm:block text-[10.5px] text-muted-foreground tabular-nums">
                키보드 1 · 2 · 3 · 4 로 빠른 채점
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {GRADES.map(({ key, label, hint, tone, Icon }, idx) => (
                <button
                  key={key}
                  type="button"
                  disabled={pending}
                  onClick={() => handleGrade(key)}
                  aria-keyshortcuts={String(idx + 1)}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-md border bg-card px-3 py-3.5 min-h-[56px] text-[13px] font-medium transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 ${tone}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="flex items-center gap-1.5">
                    {label}
                    <span className="hidden sm:inline-flex items-center justify-center h-4 min-w-[16px] rounded-sm border border-current/30 text-[9.5px] opacity-70 tabular-nums px-1">
                      {idx + 1}
                    </span>
                  </span>
                  <span className="text-[10.5px] font-normal text-muted-foreground tabular-nums">
                    {hint}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[10.5px] text-muted-foreground leading-relaxed">
              {`"다시"·"어렵"는 다음 학습 시 다시 등장합니다.`}
              <br />
              {`풀이 트랙에서 "다시"로 평가하면 오답 트랙에 자동 합류합니다.`}
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
        {/* F1 — markdown 답안 폰트 메트릭 정렬 (tabular-nums + variant-numeric).
            unicode(ⓑ·㉠) 폭 불일치 완화 + 숫자 lining 정합. */}
        <div className="mt-3 [font-variant-numeric:tabular-nums] tabular-nums">
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
