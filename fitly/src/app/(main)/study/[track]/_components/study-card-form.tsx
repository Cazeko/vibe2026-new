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
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/shared/markdown";
import { SplitView } from "@/components/shared/split-view";
import { useStudySession } from "@/lib/hooks/use-study-session";
import { getExamPageUrl } from "@/lib/supabase/storage";
import { formatExamStem } from "@/lib/exam/format-stem";
import type { CardType } from "@/types";
import type { CardHighlight, CardTag } from "@/lib/db/queries";
import { submitAnswer, gradeCard } from "../actions";
import { HighlightLayer } from "./highlight-layer";
import { CardTags } from "./card-tags";

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
    label: "어려움",
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

const DRAFT_KEY_PREFIX = "fitly:draft:";
const BLIND_KEY = "fitly:blind-mode";

export function StudyCardForm({
  card,
  highlights = [],
  tags = [],
}: {
  card: CardData;
  highlights?: CardHighlight[];
  tags?: CardTag[];
}) {
  const router = useRouter();
  const { recordCard } = useStudySession(card.type);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(card.type === "keyword");
  const [stemExpanded, setStemExpanded] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  // 헌법 v3.5.1 제16조 — 블라인드(가리기) 모드. localStorage 글로벌 보존.
  const [blindMode, setBlindMode] = useState(false);
  const toggleBlind = () => setBlindMode((v) => !v);
  const [pending, startTransition] = useTransition();
  const answerCompareRef = useRef<HTMLDivElement | null>(null);
  const draftRestoredRef = useRef(false);
  const firstMountRef = useRef(true);

  const imageUrl = getExamPageUrl(card.frontImagePath);
  // 백승환 추가 보고 (2026-05-13) — 본문 raw 노출 → formatExamStem 으로
  // 자료 블록·발문·답란 인식. 본문은 SplitView 좌측에 자연스럽게 정합.
  const cleanedFrontText = formatExamStem(card.frontText);
  const isLongStem = cleanedFrontText.length > 800;
  const draftKey = `${DRAFT_KEY_PREFIX}${card.id}`;
  const supportsDraft = card.type === "quiz" || card.type === "mistake";

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
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(draftKey);
    }
    setSavedAt(null);
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

  useEffect(() => {
    if (revealed && answerCompareRef.current) {
      answerCompareRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [revealed]);

  useEffect(() => {
    if (firstMountRef.current) {
      firstMountRef.current = false;
      return;
    }
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [card.id]);

  // 블라인드 모드 localStorage hydrate (마운트 1회).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(BLIND_KEY) === "1") setBlindMode(true);
  }, []);

  // 블라인드 모드 localStorage persist.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BLIND_KEY, blindMode ? "1" : "0");
  }, [blindMode]);

  useEffect(() => {
    draftRestoredRef.current = false;
    if (!supportsDraft) {
      draftRestoredRef.current = true;
      return;
    }
    if (typeof window === "undefined") return;
    const draft = window.localStorage.getItem(draftKey);
    if (draft) {
      setAnswer(draft);
      setSavedAt(Date.now());
    } else {
      setAnswer("");
      setSavedAt(null);
    }
    draftRestoredRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  useEffect(() => {
    if (!supportsDraft) return;
    if (!draftRestoredRef.current) return;
    if (typeof window === "undefined") return;
    if (!answer) {
      window.localStorage.removeItem(draftKey);
      setSavedAt(null);
      return;
    }
    const t = setTimeout(() => {
      window.localStorage.setItem(draftKey, answer);
      setSavedAt(Date.now());
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer]);

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

  const sessionProgressPct = Math.min(100, sessionCount * 8);

  // Track 1.1 (v3.5.4) — 본문 카드 (quiz/mistake 용).
  const stemCard = (
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

        {imageUrl && <PdfImage src={imageUrl} />}

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
              {/* 헌법 v3.5.1 제16조 — 본문에도 사용자 형광펜 적용 (front_text surface). */}
              <HighlightLayer
                cardId={card.id}
                surface="front_text"
                initialHighlights={highlights}
              >
                <p className="font-serif text-[14px] leading-[1.7] whitespace-pre-wrap text-foreground/85">
                  {cleanedFrontText}
                </p>
              </HighlightLayer>
              {isLongStem && !stemExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-card via-card/90 to-transparent pointer-events-none" />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // 답안 입력 + 비교 + 경고 (quiz/mistake).
  // Track 1.1 — SplitView 우측에서는 단일 컬럼이 자연스러우므로 grid-cols 제거.
  const answerArea = (
    <div className="space-y-5">
      {showAnswerInput && (
        <Card className="border-rule">
          <CardContent className="p-6">
            <div className="flex items-baseline justify-between gap-2">
              <label
                htmlFor="answer-input"
                className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground cursor-pointer"
              >
                내 답안
              </label>
              <span
                className="inline-flex items-center gap-2 text-[10.5px] text-muted-foreground tabular-nums"
                aria-live="polite"
              >
                {savedAt ? (
                  <span className="inline-flex items-center gap-1 text-evergreen/80">
                    <CheckCircle2 className="h-3 w-3" aria-hidden /> 자동 저장됨
                  </span>
                ) : answer ? (
                  <span className="opacity-70">자동 저장 중…</span>
                ) : null}
                <span>{answer.length}자</span>
              </span>
            </div>
            <textarea
              id="answer-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={9}
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

      {revealed && card.backMd && (
        <div ref={answerCompareRef} className="scroll-mt-4 space-y-4">
          {answer.trim().length > 0 && (
            <AnswerBox label="내 답안" tone="muted" plainText={answer} />
          )}
          <AnswerBox
            label="AI 모범답안"
            tone="evergreen"
            markdown={card.backMd}
            verified={card.verifiedAnswer}
            cardId={card.id}
            highlights={highlights}
            blindMode={blindMode}
            onToggleBlind={toggleBlind}
          />
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
    </div>
  );

  return (
    <div className="space-y-5">
      {/* 헌법 v3.5.1 제16조 — 카드 메타 영역. 사용자 커스텀 해시태그.
          본 영역은 트랙(quiz/keyword/mistake) 무관 카드 단위 메타. */}
      <CardTags cardId={card.id} initialTags={tags} />

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

      {/* Track 1.1 (v3.5.4, 헌법 v3.5.3 §16 단서) — 본문↔답안 좌우 분할.
          xl(≥1280px) 이상에서 활성, 미만은 vertical stack fallback. localStorage 비율 저장. */}
      {card.type !== "keyword" && (
        <SplitView
          storageKey={`study-${card.type}`}
          left={stemCard}
          right={answerArea}
          stickyLeft
          stickyTop="top-[96px]"
          defaultRatio={0.5}
          minRatio={0.35}
          maxRatio={0.65}
          ariaLabel="본문 / 답안 분할 비율"
        />
      )}

      {/* 키워드 트랙 — 정리 노트만 중앙 배치. */}
      {card.type === "keyword" && (
        <div className="max-w-3xl mx-auto">
          {revealed && card.backMd && (
            <AnswerBox
              label="정리 노트"
              tone="evergreen"
              markdown={card.backMd}
              verified={card.verifiedAnswer}
              zoomable
              cardId={card.id}
              highlights={highlights}
              blindMode={blindMode}
              onToggleBlind={toggleBlind}
            />
          )}
          {revealed && !card.backMd && (
            <Card className="border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30">
              <CardContent className="p-6 flex gap-3">
                <AlertCircle
                  className="h-5 w-5 text-warning shrink-0 mt-0.5"
                  aria-hidden
                />
                <p className="text-[12.5px] text-foreground/80 leading-relaxed">
                  본 카드의 정리 노트가 아직 시드되지 않았습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* v3.5.2 (2026-05-14) — 자가 채점 sticky 슬림화.
          종전 약 140px 높이 → ~52px. 헤더 라벨·안내 텍스트·세로 hint 제거하여
          본문 가시성 우선. label + 단축키 kbd 만 단일 라인. */}
      {revealed && (
        <Card
          className="sticky z-20 border-rule shadow-[0_-4px_12px_rgba(26,32,39,0.05)] bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90"
          style={{ bottom: "calc(var(--mini-player-h, 0px) + 8px)" }}
        >
          <CardContent className="px-2.5 py-2">
            <div className="grid grid-cols-4 gap-1.5">
              {GRADES.map(({ key, label, hint, tone, Icon }, idx) => (
                <button
                  key={key}
                  type="button"
                  disabled={pending}
                  onClick={() => handleGrade(key)}
                  aria-keyshortcuts={String(idx + 1)}
                  aria-label={`${label} · ${hint}`}
                  title={`${label} — ${hint}`}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md border bg-card h-9 px-1.5 text-[12.5px] font-medium transition-[colors,transform] duration-100 active:scale-[0.96] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 ${tone}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>{label}</span>
                  <kbd className="hidden sm:inline-flex items-center justify-center h-4 min-w-[16px] rounded-[3px] border border-muted-foreground/30 bg-card/80 text-muted-foreground text-[9.5px] font-bold leading-none tabular-nums px-1 font-sans">
                    {idx + 1}
                  </kbd>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PdfImage({ src }: { src: string }) {
  const ZOOM_STEPS = [1, 1.5, 2, 3];
  const [zoom, setZoom] = useState(1);
  const idx = ZOOM_STEPS.findIndex((z) => Math.abs(z - zoom) < 0.01);
  const canZoomIn = idx < ZOOM_STEPS.length - 1;
  const canZoomOut = idx > 0;
  return (
    <div className="mt-5 relative rounded-md border border-rule overflow-hidden bg-cream-soft">
      <div
        className="overflow-auto max-h-[70vh]"
        aria-label="시험 본문 이미지 영역"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* v3.6 외부 평가 #3.11 — 다크모드 PDF 눈부심 방지: brightness(0.85) +
            contrast(1.15). 라이트모드는 원본 유지 (filter: none). */}
        <img
          src={src}
          alt="시험 본문 (PDF 페이지)"
          className="block w-full origin-top-left transition-transform duration-150 dark:[filter:brightness(0.85)_contrast(1.15)]"
          loading="lazy"
          width={1240}
          height={1754}
          style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
        />
      </div>
      {/* v3.6 외부 평가 #3.2 — 컨트롤러 박스 backdrop-filter blur 강화 (블러 8px). */}
      <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/70 px-1 py-1 border border-rule shadow-sm">
        <button
          type="button"
          onClick={() => canZoomOut && setZoom(ZOOM_STEPS[idx - 1])}
          disabled={!canZoomOut}
          aria-label="축소"
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary/60 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
        >
          <ZoomOut className="h-3.5 w-3.5" aria-hidden />
        </button>
        <span className="text-[10.5px] text-muted-foreground tabular-nums w-9 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => canZoomIn && setZoom(ZOOM_STEPS[idx + 1])}
          disabled={!canZoomIn}
          aria-label="확대"
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary/60 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
        >
          <ZoomIn className="h-3.5 w-3.5" aria-hidden />
        </button>
        <span className="mx-1 inline-block h-4 w-px bg-rule" aria-hidden />
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="새 탭에서 전체 크기로 보기"
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
        >
          <Maximize2 className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}

function AnswerBox({
  label,
  tone,
  markdown,
  plainText,
  verified,
  zoomable = false,
  cardId,
  highlights,
  blindMode = false,
  onToggleBlind,
}: {
  label: string;
  tone: "evergreen" | "muted";
  markdown?: string | null;
  plainText?: string;
  verified?: boolean;
  zoomable?: boolean;
  // 헌법 v3.5.1 제16조 — 사용자 형광펜 prop. plainText("내 답안") 에는 비전달.
  cardId?: string;
  highlights?: CardHighlight[];
  // 헌법 v3.5.1 제16조 — 블라인드(가리기) 모드. plainText 박스에는 미적용.
  blindMode?: boolean;
  onToggleBlind?: () => void;
}) {
  const toneClass =
    tone === "evergreen"
      ? "border-l-4 border-evergreen"
      : "border-l-4 border-rule-strong";
  const labelClass =
    tone === "evergreen" ? "text-evergreen" : "text-muted-foreground";

  const [zoom, setZoom] = useState(1);
  const ZOOM_STEPS = [0.85, 1, 1.15, 1.3];
  function adjustZoom(direction: -1 | 1) {
    const idx = ZOOM_STEPS.findIndex((z) => Math.abs(z - zoom) < 0.01);
    const next = Math.min(
      ZOOM_STEPS.length - 1,
      Math.max(0, (idx === -1 ? 1 : idx) + direction),
    );
    setZoom(ZOOM_STEPS[next]);
  }

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
          {(onToggleBlind || zoomable) && (
            <span className="ml-auto inline-flex items-center gap-1.5">
              {/* 헌법 v3.5.1 제16조 — 블라인드 모드 토글. markdown 본문 의 strong
                  (학습 핵심 마크업) 을 검정 박스로 가린다. 클릭 시 단어별 reveal. */}
              {markdown && onToggleBlind && (
                <button
                  type="button"
                  onClick={onToggleBlind}
                  aria-pressed={blindMode}
                  aria-label={
                    blindMode
                      ? "블라인드 모드 끄기"
                      : "블라인드 모드 켜기 — 핵심 키워드 가리기"
                  }
                  className={`inline-flex items-center gap-1 h-8 px-2 rounded border text-[11px] transition-colors ${
                    blindMode
                      ? "border-foreground/60 bg-foreground/10 text-foreground"
                      : "border-rule text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {blindMode ? (
                    <EyeOff className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                  )}
                  <span>블라인드</span>
                </button>
              )}
              {zoomable && (
                // v3.6 외부 평가 #3.10 — 모바일 오터치 회피. 버튼 hitbox h-8 w-8 +
                // gap-1.5 로 확대. 시각 크기는 동일하나 터치 영역 ≥32×32 (모바일).
                <>
                  <button
                    type="button"
                    onClick={() => adjustZoom(-1)}
                    disabled={zoom <= ZOOM_STEPS[0]}
                    aria-label="글자 작게"
                    className="inline-flex h-8 w-8 items-center justify-center rounded border border-rule text-muted-foreground hover:bg-secondary/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="text-[12px] leading-none">A−</span>
                  </button>
                  <span className="text-[10px] text-muted-foreground tabular-nums w-9 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustZoom(1)}
                    disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                    aria-label="글자 크게"
                    className="inline-flex h-8 w-8 items-center justify-center rounded border border-rule text-muted-foreground hover:bg-secondary/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="text-[12px] leading-none">A+</span>
                  </button>
                </>
              )}
            </span>
          )}
        </div>
        <div
          className={
            "mt-3 [font-variant-numeric:tabular-nums] tabular-nums origin-top-left" +
            (zoomable ? " [&_*]:![font-size:inherit] [&_*]:![line-height:1.65]" : "")
          }
          style={zoomable ? { fontSize: `${Math.round(zoom * 14)}px` } : undefined}
        >
          {markdown ? (
            cardId ? (
              <HighlightLayer
                cardId={cardId}
                surface="back_md"
                initialHighlights={highlights ?? []}
              >
                <Markdown serif blind={blindMode}>
                  {markdown}
                </Markdown>
              </HighlightLayer>
            ) : (
              <Markdown serif blind={blindMode}>
                {markdown}
              </Markdown>
            )
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
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10.5px] text-warning-text">
      <ShieldCheck className="h-3 w-3" />
      검증 필요
    </span>
  );
}
