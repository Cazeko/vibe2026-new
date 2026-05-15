"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  RefreshCw,
  ThumbsUp,
  Zap,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Bookmark,
  Star,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/shared/markdown";
import { SplitView } from "@/components/shared/split-view";
import { ExamItemLightbox } from "@/components/shared/exam-item-lightbox";
import { useStudySession } from "@/lib/hooks/use-study-session";
import { getExamPageUrl } from "@/lib/supabase/storage";
import { formatExamStem } from "@/lib/exam/format-stem";
import { parseAnswer } from "@/lib/exam/sub-questions";
import type { AnswerSource, CardType } from "@/types";
import type { CardHighlight, CardTag } from "@/lib/db/queries";
import { submitAnswer, gradeCard, setCardMark } from "../actions";
import { HighlightLayer, type HighlightLayerHandle } from "./highlight-layer";
import { Underline as UnderlineIcon } from "lucide-react";
import { CardTags } from "./card-tags";
import { WorkspaceTopbar } from "./workspace-topbar";
import { AnalysisPanel } from "./analysis-panel";
import { AssistantFab } from "./assistant-fab";
import { ReportCardButton } from "./report-card-button";
import { SubAnswerInput } from "./sub-answer-input";

type CardData = {
  id: string;
  type: CardType;
  frontText: string;
  frontImagePath: string | null;
  frontImagePaths: string[];
  backMd: string | null;
  verifiedAnswer: boolean;
  // 헌법 §30의2 4계층 출처 (M4, PR-11).
  answerSource: AnswerSource;
  paperLabel: string | null;
  itemFormat: string | null;
  itemPoints: number | null;
  // 백승환 #9 (2026-05-15) — 카드 마크.
  mark: "bookmark" | "star" | "unsure" | null;
};

// 백승환 #5 (2026-05-15) — 세션 큐 메타. 점프/이전·다음용 최소 데이터.
type QueueItem = {
  id: string;
  paperLabel: string | null;
  mark: "bookmark" | "star" | "unsure" | null;
};

type MarkKind = "bookmark" | "star" | "unsure";

// 백승환 #8 (2026-05-15) — 답안 시도 이력. attemptedAt 은 ISO string 으로
// serializable 하게 server → client 전달.
export type AttemptRecord = {
  id: string;
  answerMd: string;
  selfGrade: string | null;
  attemptedAt: string;
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
  remainingCount = 0,
  sessionQueue = [],
  currentIndex = 0,
  markFilter = null,
  attemptHistory = [],
}: {
  card: CardData;
  highlights?: CardHighlight[];
  tags?: CardTag[];
  remainingCount?: number;
  sessionQueue?: QueueItem[];
  currentIndex?: number;
  markFilter?: "bookmark" | "star" | "unsure" | null;
  attemptHistory?: AttemptRecord[];
}) {
  const router = useRouter();
  const { recordCard } = useStudySession(card.type);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(card.type === "keyword");
  const [stemExpanded, setStemExpanded] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  // 백승환 #9 (2026-05-15) — 마크 낙관 갱신. router.refresh 까지 즉시 반영.
  const [optimisticMark, setOptimisticMark] = useState<MarkKind | null>(card.mark);
  const [markPending, startMarkTransition] = useTransition();
  // 헌법 v3.5.1 제16조 — 블라인드(가리기) 모드. localStorage 글로벌 보존.
  const [blindMode, setBlindMode] = useState(false);
  const toggleBlind = () => setBlindMode((v) => !v);
  const [pending, startTransition] = useTransition();
  const analysisAnchorRef = useRef<HTMLDivElement | null>(null);
  const draftRestoredRef = useRef(false);
  const firstMountRef = useRef(true);

  // 0017 (2026-05-14) — 한 문항이 여러 PDF 페이지에 걸친 경우 모든 페이지 URL.
  // 마이그레이션 미적용 row 와도 호환되도록 단일 경로 fallback.
  const imageUrls = (() => {
    const paths =
      card.frontImagePaths && card.frontImagePaths.length > 0
        ? card.frontImagePaths
        : card.frontImagePath
          ? [card.frontImagePath]
          : [];
    return paths
      .map((p) => getExamPageUrl(p))
      .filter((u): u is string => !!u);
  })();
  // 백승환 추가 보고 (2026-05-13) — 본문 raw 노출 → formatExamStem 으로
  // 자료 블록·발문·답란 인식. 본문은 SplitView 좌측에 자연스럽게 정합.
  const cleanedFrontText = formatExamStem(card.frontText);
  const isLongStem = cleanedFrontText.length > 800;
  const draftKey = `${DRAFT_KEY_PREFIX}${card.id}`;
  const supportsDraft = card.type === "quiz" || card.type === "mistake";
  const isWorkspaceTrack = card.type === "quiz" || card.type === "mistake";

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
    // UX (주인님 보고 2026-05-15) — 종전에는 client reset 을 `await gradeCard`
    // 뒤에 두어 다시·어려움(mistake 합류 INSERT 포함)·쉬움(AI 분석 server action
    // 과 동일 함수 슬롯 큐잉) 평가 시 UI 가 멈춰 보였다. client 가 결정 가능한
    // 입력 영역 초기화는 transition 밖에서 동기 적용해 다음 사이클로 곧장 진입.
    setAnswer("");
    setRevealed(card.type === "keyword");
    setStemExpanded(false);
    // server mutation + 새 카드 SSR 재로드는 백그라운드 transition. 카드 본문
    // 자체는 router.refresh 가 완료될 때 새 카드로 교체된다.
    startTransition(async () => {
      await gradeCard(card.id, grade);
      router.refresh();
    });
  }

  const showAnswerInput =
    !revealed && (card.type === "quiz" || card.type === "mistake");

  useEffect(() => {
    if (revealed && analysisAnchorRef.current) {
      analysisAnchorRef.current.scrollIntoView({
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

  // 백승환 #9 (2026-05-15) — 카드 변경 시 mark optimistic state 동기화.
  useEffect(() => {
    setOptimisticMark(card.mark);
  }, [card.id, card.mark]);

  // 백승환 #9 (2026-05-15) — 마크 토글. 동일 마크 클릭 시 해제.
  const handleMarkToggle = useCallback(
    (kind: MarkKind) => {
      const next = optimisticMark === kind ? null : kind;
      setOptimisticMark(next);
      startMarkTransition(async () => {
        const res = await setCardMark(card.id, next);
        if ("error" in res) {
          setOptimisticMark(card.mark);
        } else {
          router.refresh();
        }
      });
    },
    [card.id, card.mark, optimisticMark, router],
  );

  // 백승환 #5 (2026-05-15) — 큐 내 prev/next 점프. URL ?card=xxx 로 이동.
  const trackPath = `/study/${card.type}`;
  const buildQueueUrl = useCallback(
    (cardId: string) => {
      const qs = new URLSearchParams();
      qs.set("card", cardId);
      if (markFilter) qs.set("mark", markFilter);
      return `${trackPath}?${qs.toString()}`;
    },
    [trackPath, markFilter],
  );
  const prevCard = currentIndex > 0 ? sessionQueue[currentIndex - 1] : null;
  const nextCard =
    currentIndex < sessionQueue.length - 1
      ? sessionQueue[currentIndex + 1]
      : null;

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

  // 본문 카드 (quiz/mistake 용) — SplitView 좌측 ProblemPane 의 상단.
  // 0017 (2026-05-14) — 출처와 점수 사이 *중앙*에 PDF 컨트롤(페이지/줌) 배치.
  // PdfViewer 가 헤더 컨트롤 + 본문 뷰포트를 한 단위로 관리한다.
  const stemCard = (
    <Card className="border-rule">
      <CardContent className="p-6">
        <PdfViewer
          imageUrls={imageUrls}
          paperLabel={card.paperLabel}
          itemFormat={card.itemFormat}
          itemPoints={card.itemPoints}
          stemText={cleanedFrontText}
        />

        {card.frontText && (
          <div className="mt-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                본문 텍스트{imageUrls.length > 0 && " (검색·낭독 보조)"}
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

  // 백승환 피드백 #3 (2026-05-15) — 답안 입력창을 우측 패널로 격상.
  // 백승환 #6 (2026-05-15) — 소문항별 답안 입력 (SubAnswerInput).
  //   단일/분리 모드 토글 + stem 자동 감지 라벨 제안. 합산 string 으로
  //   server action 에 전달 (submitAnswer signature 호환).
  const answerInputCard = (
    <Card className="border-rule">
      <CardContent className="p-5">
        <SubAnswerInput
          value={answer}
          onChange={setAnswer}
          stemText={cleanedFrontText}
          pending={pending}
          onSubmit={handleReveal}
          savedAt={savedAt}
        />
      </CardContent>
    </Card>
  );

  // ProblemPane — 본문 PDF/텍스트 (좌측). 답안 입력은 우측 패널로 이동.
  const problemPane = (
    <div className="space-y-4">
      {stemCard}

      {/* 채점 후 — 답안 사본 + 자가 채점 4 버튼 통합 (2026-05-15 주인님 발화).
          종전 화면 하단 sticky Card 가 시각 부담이라 좌측 답안 사본 카드 안으로
          통합. 답안 본문 검토 → 그 자리에서 등급 결정 시선 흐름 정합.
          소문항이 분리되어 있으면 라벨 chip + 본문 분리 표기 (#6).
          답안이 비어 있어도 채점 가능 — 사본 영역에 placeholder 노출. */}
      {revealed && (
        <Card className="border-l-4 border-rule-strong border-y border-r border-rule bg-card">
          <CardContent className="p-5">
            <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
              내 답안
            </span>
            <div className="mt-3 space-y-3">
              {answer.trim().length > 0 ? (
                <ReadonlySubAnswers combined={answer} />
              ) : (
                <p className="font-sans text-[13px] italic text-muted-foreground">
                  (빈 답안으로 채점)
                </p>
              )}
            </div>

            {/* 자가 채점 — 답안 검토 후 등급 결정. 본문과 시각 분리 위해
                얇은 구분선 + 라벨 헤더. 키보드 1/2/3/4 단축키 유지. */}
            <div className="mt-5 pt-4 border-t border-rule/60">
              <span className="block text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-3">
                이 답안 자가 채점
              </span>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const sessionProgressPct = Math.min(100, sessionCount * 8);

  return (
    <div className="space-y-4">
      {/* 백승환 #5/#9 (2026-05-15) — 카드 메타 영역.
          (1) 좌: 큐 점프 nav (이전·다음·dot strip)
          (2) 우: 마크 토글 (북마크 / 별표 / 모르겠음)
          (3) 그 아래: 사용자 커스텀 해시태그(기존). */}
      {sessionQueue.length > 1 && (
        <QueueNav
          queue={sessionQueue}
          currentIndex={currentIndex}
          buildUrl={buildQueueUrl}
          prevCard={prevCard}
          nextCard={nextCard}
        />
      )}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <CardTags cardId={card.id} initialTags={tags} />
        <MarkToggle
          current={optimisticMark}
          onToggle={handleMarkToggle}
          disabled={markPending}
        />
      </div>

      {isWorkspaceTrack && (
        <>
          <WorkspaceTopbar
            track={card.type}
            paperLabel={card.paperLabel}
            itemFormat={card.itemFormat}
            itemPoints={card.itemPoints}
            sessionCount={sessionCount}
            remainingCount={remainingCount}
            revealed={revealed}
            cardId={card.id}
          />

          {/* SplitView — ProblemPane (좌) | (채점 전 답안 입력 / 채점 후 분석) (우).
              xl(≥1280px) 이상에서 활성, 미만은 vertical stack fallback.
              백승환 #3 (2026-05-15) — 답안 입력을 우측에 배치하여 본문 보면서
              답안 작성 가능. 채점 후에는 동일 위치가 분석 패널로 전환. */}
          <div ref={analysisAnchorRef} className="scroll-mt-4">
            <SplitView
              storageKey={`study-${card.type}`}
              left={problemPane}
              right={
                showAnswerInput ? (
                  answerInputCard
                ) : (
                  <AnalysisPanel
                    revealed={revealed}
                    cardId={card.id}
                    backMd={card.backMd}
                    verifiedAnswer={card.verifiedAnswer}
                    highlights={highlights}
                    blindMode={blindMode}
                    onToggleBlind={toggleBlind}
                    userAnswer={answer}
                    attemptHistory={attemptHistory}
                  />
                )
              }
              stickyLeft
              stickyTop="top-[96px]"
              defaultRatio={0.5}
              minRatio={0.35}
              maxRatio={0.65}
              ariaLabel="본문 / 답안·분석 분할 비율"
            />
          </div>
        </>
      )}

      {/* 키워드 트랙 — 정리 노트만 중앙 배치. 본 PR 1 스코프 외. */}
      {card.type === "keyword" && (
        <div className="max-w-3xl mx-auto">
          {sessionCount > 0 && (
            <div
              className="mb-4 flex items-center gap-3 text-[11px] text-muted-foreground"
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
          {revealed && card.backMd && (
            <KeywordNoteBox
              markdown={card.backMd}
              source={card.answerSource}
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
          {/* 코드리뷰 C.H2 (2026-05-15, 시행규칙 33 §35) — 사용자 AI 답안 신고 채널.
              reveal 후에만 노출 (학습자가 모범답안을 확인한 뒤 오류 보고). */}
          {revealed && (
            <div className="flex justify-end">
              <ReportCardButton cardId={card.id} />
            </div>
          )}
        </div>
      )}

      {/* 자가 채점 sticky Card 는 답안 사본 카드 안 통합 위치로 이전 (2026-05-15).
          좌측 답안 본문 검토 → 그 자리에서 등급 결정 시선 흐름 정합. */}

      {/* 학습 본업(풀이 트랙) 한정 AI 학습 도우미.
          fixed 진입점이라 SplitView 외부, 페이지 우측 하단 floating. */}
      {isWorkspaceTrack && (
        <AssistantFab cardId={card.id} userAnswer={answer} />
      )}
    </div>
  );
}

// 백승환 #5 (2026-05-15) — 큐 점프 nav.
// 좌: 이전 버튼, 중앙: dot strip (현재 카드 = evergreen, 마크 카드 = 색 dot),
// 우: 다음 버튼. dot strip 은 큐 길이 ≤ 12 일 때 모두 노출, 초과 시 현재 ±5 만.
const MARK_COLOR: Record<MarkKind, string> = {
  bookmark: "bg-info",
  star: "bg-warning",
  unsure: "bg-error",
};

function QueueNav({
  queue,
  currentIndex,
  buildUrl,
  prevCard,
  nextCard,
}: {
  queue: QueueItem[];
  currentIndex: number;
  buildUrl: (cardId: string) => string;
  prevCard: QueueItem | null;
  nextCard: QueueItem | null;
}) {
  const router = useRouter();
  // 키보드 단축키 J/K — 이전/다음 (주인님 #2 발화 2026-05-15: J=이전, K=다음 으로 스왑).
  // textarea/input 안에서는 무시.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tgt = e.target as HTMLElement | null;
      const tag = tgt?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tgt?.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "j" && prevCard) {
        e.preventDefault();
        router.push(buildUrl(prevCard.id));
      } else if (e.key === "k" && nextCard) {
        e.preventDefault();
        router.push(buildUrl(nextCard.id));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextCard, prevCard, buildUrl, router]);

  // dot strip slice — 큐 12 초과 시 현재 ±5.
  const visible = queue.length <= 12
    ? queue.map((c, i) => ({ c, i }))
    : queue
        .slice(Math.max(0, currentIndex - 5), Math.min(queue.length, currentIndex + 6))
        .map((c, idx) => ({ c, i: Math.max(0, currentIndex - 5) + idx }));

  return (
    <div
      role="navigation"
      aria-label="문제 큐 이동"
      className="flex items-center justify-between gap-2 rounded-md border border-rule bg-card/40 px-3 py-1.5"
    >
      <Button
        variant="ghost"
        size="sm"
        asChild={!!prevCard}
        disabled={!prevCard}
        className="px-2 h-7 text-[11.5px] disabled:opacity-40"
      >
        {prevCard ? (
          <Link href={buildUrl(prevCard.id)} prefetch={false} aria-label="이전 문제 (J)">
            <ChevronLeft className="h-3.5 w-3.5 mr-0.5" aria-hidden />
            이전
            <kbd className="hidden sm:inline-flex ml-1.5 items-center justify-center h-4 min-w-[16px] rounded-[3px] border border-muted-foreground/30 bg-card/80 text-muted-foreground text-[9.5px] font-bold leading-none tabular-nums px-1 font-sans">
              J
            </kbd>
          </Link>
        ) : (
          <span>
            <ChevronLeft className="h-3.5 w-3.5 mr-0.5" aria-hidden />
            이전
          </span>
        )}
      </Button>

      <div
        className="flex items-center gap-1 overflow-x-auto"
        role="tablist"
        aria-label="문제 점프"
      >
        {visible.map(({ c, i }) => {
          const isCurrent = i === currentIndex;
          const markColor = c.mark ? MARK_COLOR[c.mark] : null;
          return (
            <Link
              key={c.id}
              href={buildUrl(c.id)}
              prefetch={false}
              role="tab"
              aria-selected={isCurrent}
              aria-label={`${i + 1}번째 문제${c.paperLabel ? ` — ${c.paperLabel}` : ""}${c.mark ? ` (마크: ${c.mark})` : ""}`}
              title={`${i + 1} / ${queue.length}${c.paperLabel ? ` — ${c.paperLabel}` : ""}`}
              className={`relative inline-flex items-center justify-center min-w-[20px] h-5 rounded text-[10.5px] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 ${
                isCurrent
                  ? "bg-evergreen text-white font-semibold"
                  : "text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              {i + 1}
              {markColor && !isCurrent && (
                <span
                  aria-hidden
                  className={`absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ${markColor}`}
                />
              )}
            </Link>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="sm"
        asChild={!!nextCard}
        disabled={!nextCard}
        className="px-2 h-7 text-[11.5px] disabled:opacity-40"
      >
        {nextCard ? (
          <Link href={buildUrl(nextCard.id)} prefetch={false} aria-label="다음 문제 (K)">
            <kbd className="hidden sm:inline-flex mr-1.5 items-center justify-center h-4 min-w-[16px] rounded-[3px] border border-muted-foreground/30 bg-card/80 text-muted-foreground text-[9.5px] font-bold leading-none tabular-nums px-1 font-sans">
              K
            </kbd>
            다음
            <ChevronRight className="h-3.5 w-3.5 ml-0.5" aria-hidden />
          </Link>
        ) : (
          <span>
            다음
            <ChevronRight className="h-3.5 w-3.5 ml-0.5" aria-hidden />
          </span>
        )}
      </Button>
    </div>
  );
}

// 백승환 #9 (2026-05-15) — 마크 토글. 동일 마크 재클릭 시 해제.
function MarkToggle({
  current,
  onToggle,
  disabled,
}: {
  current: MarkKind | null;
  onToggle: (kind: MarkKind) => void;
  disabled: boolean;
}) {
  const buttons: { key: MarkKind; label: string; Icon: typeof Bookmark; tone: string }[] = [
    {
      key: "bookmark",
      label: "북마크",
      Icon: Bookmark,
      tone: "text-info border-info/40 bg-info/10",
    },
    {
      key: "star",
      label: "별표",
      Icon: Star,
      tone: "text-warning border-warning/40 bg-warning/10",
    },
    {
      key: "unsure",
      label: "모르겠음",
      Icon: HelpCircle,
      tone: "text-error border-error/40 bg-error/10",
    },
  ];
  return (
    <div className="inline-flex items-center gap-1" aria-label="카드 마크">
      {buttons.map(({ key, label, Icon, tone }) => {
        const active = current === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            disabled={disabled}
            aria-pressed={active}
            aria-label={`${label}${active ? " 해제" : ""}`}
            title={`${label}${active ? " 해제" : " 추가"}`}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 ${
              active
                ? `${tone} font-semibold`
                : "border-rule text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <Icon className="h-3 w-3" aria-hidden />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// 0017 (2026-05-14, 주인님 보고 #1·#2) — 시험 본문 PDF 뷰어.
// 헌법 §16 정합 — 본문 카드 인터랙션 다듬기.
//
// 요건
//   #1 한 문항이 여러 PDF 페이지에 걸친 경우 < > 버튼으로 페이지 전환.
//   #2 줌 시 카드 크기가 아닌 PDF *이미지*가 확대. PC 휠 줌 + 드래그 팬, 태블릿
//      터치 핀치 줌 + 단일 터치 팬. 줌 컨트롤 위치를 "출처 — (여기) — 점수"
//      사이로 이동.
//
// 구현 요지
//   - 뷰포트(고정 높이 70vh) 내부에서 이미지에 transform: translate scale 적용.
//   - 줌 단계: 1 / 1.25 / 1.5 / 2 / 3.
//   - 헤더에 출처 · 컨트롤 · 점수 한 줄. 컨트롤은 페이지 네비 + 줌 통합.
//   - 마우스 드래그(좌클릭 hold) 또는 단일 터치로 팬, 줌 ≥ 1.05 일 때만 활성.
//   - PC 휠(deltaY) 로 줌 — Ctrl 미요구. preventDefault 로 페이지 스크롤 잠금.
//   - 휠 줌은 커서 위치 기준 anchor — 자연스러운 확대 체감.

// F2 (2026-05-15) — 사후 리뷰 정합: 모듈 상수로 hoist. 매 렌더 새 배열
// reference 로 인해 useEffect/useCallback dep 가 변동하여 wheel listener 가
// 반복 재바인딩되던 회귀 해소 (react-best-practices §5 Narrow effect deps).
const ZOOM_STEPS = [1, 1.25, 1.5, 2, 3] as const;
const MIN_ZOOM = ZOOM_STEPS[0];
const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1];

// 백승환 #2 후속 — paperLabel("2024학년도 교직논술 3번") 끝 숫자 추출.
// 미파싱 시 1 fallback (lightbox 헤더 "{N}번" 표기용).
function extractItemNo(paperLabel: string | null): number {
  if (!paperLabel) return 1;
  const m = paperLabel.match(/(\d+)\s*번\s*$/);
  return m ? Number(m[1]) : 1;
}

// 백승환 #6 (2026-05-15) — readonly 답안 표시. 합산 string → 소문항 분리 표기.
function ReadonlySubAnswers({ combined }: { combined: string }) {
  const subs = parseAnswer(combined);
  if (subs.length <= 1 && !subs[0]?.label) {
    return (
      <div className="font-sans text-[13.5px] leading-[1.75] whitespace-pre-wrap text-foreground/90">
        {combined}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {subs.map((s, i) => (
        <div key={i} className="space-y-1">
          {s.label && (
            <span className="inline-flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded-full bg-evergreen/10 text-evergreen text-[10.5px] font-semibold tabular-nums">
              {/^[가-힣]$/.test(s.label) ? `(${s.label})` : /^[1-6]$/.test(s.label) ? `${s.label})` : s.label}
            </span>
          )}
          <div className="font-sans text-[13.5px] leading-[1.75] whitespace-pre-wrap text-foreground/90">
            {s.text || <span className="text-muted-foreground italic">(빈 답안)</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function PdfViewer({
  imageUrls,
  paperLabel,
  itemFormat,
  itemPoints,
  stemText,
}: {
  imageUrls: string[];
  paperLabel: string | null;
  itemFormat: string | null;
  itemPoints: number | null;
  stemText: string;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  // 백승환 피드백 #2 (2026-05-15) — 새 탭 → 모달 lightbox. 학습 흐름 이탈 방지.
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  // pointer drag pan — pointer 단일 모델로 마우스 + 터치 + 펜 통일.
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  // 핀치 줌 — 활성 pointer 2개 트래킹. F8 anchor 보정 정합으로 시작 시점
  // anchor(중심점) + base offset 도 캡처.
  const pinchStateRef = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    initialDist: number;
    initialZoom: number;
    anchorX: number;
    anchorY: number;
    baseOffsetX: number;
    baseOffsetY: number;
  }>({
    pointers: new Map(),
    initialDist: 0,
    initialZoom: 1,
    anchorX: 0,
    anchorY: 0,
    baseOffsetX: 0,
    baseOffsetY: 0,
  });

  const pageCount = imageUrls.length;
  const hasImage = pageCount > 0;
  const src = hasImage ? imageUrls[pageIndex] : null;
  const canZoomIn = zoom < MAX_ZOOM - 0.01;
  const canZoomOut = zoom > MIN_ZOOM + 0.01;

  // 페이지 전환 시 offset/zoom 초기화 — 새 페이지를 자연스럽게 처음부터.
  const goPage = useCallback((dir: -1 | 1) => {
    setPageIndex((p) => {
      const next = Math.max(0, Math.min(pageCount - 1, p + dir));
      if (next !== p) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, [pageCount]);

  const nextStep = useCallback((direction: -1 | 1) => {
    setZoom((z) => {
      const idx = ZOOM_STEPS.findIndex((s) => Math.abs(s - z) < 0.01);
      const curIdx =
        idx === -1
          ? ZOOM_STEPS.reduce(
              (best, _s, i) =>
                Math.abs(ZOOM_STEPS[i] - z) < Math.abs(ZOOM_STEPS[best] - z)
                  ? i
                  : best,
              0,
            )
          : idx;
      const nextIdx = Math.max(
        0,
        Math.min(ZOOM_STEPS.length - 1, curIdx + direction),
      );
      const nextZ = ZOOM_STEPS[nextIdx];
      // 줌 1 이하로 복귀하면 팬 오프셋 리셋 — UX 직관 (전체 화면 복귀).
      if (nextZ <= 1.001) setOffset({ x: 0, y: 0 });
      return nextZ;
    });
  }, []);

  // 주인님 보고 #25 (2026-05-15) — React onWheel 은 passive listener 로
  // 부착되어 e.preventDefault() 가 무시되고 fitly 페이지가 같이 스크롤되던
  // 회귀. native addEventListener({ passive: false }) 로 직접 등록한다.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    function onWheel(e: WheelEvent) {
      if (!hasImage) return;
      // 페이지 스크롤 차단 — passive: false 일 때만 유효.
      e.preventDefault();
      e.stopPropagation();
      const dir = e.deltaY > 0 ? -1 : 1;
      const rect = vp!.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      setZoom((prevZoom) => {
        const idx = ZOOM_STEPS.findIndex(
          (s) => Math.abs(s - prevZoom) < 0.01,
        );
        const curIdx =
          idx === -1
            ? ZOOM_STEPS.reduce(
                (best, _s, i) =>
                  Math.abs(ZOOM_STEPS[i] - prevZoom) <
                  Math.abs(ZOOM_STEPS[best] - prevZoom)
                    ? i
                    : best,
                0,
              )
            : idx;
        const nextIdx = Math.max(
          0,
          Math.min(ZOOM_STEPS.length - 1, curIdx + dir),
        );
        const nextZ = ZOOM_STEPS[nextIdx];
        if (Math.abs(nextZ - prevZoom) < 0.001) return prevZoom;
        const ratio = nextZ / prevZoom;
        setOffset((o) => {
          if (nextZ <= 1.001) return { x: 0, y: 0 };
          return {
            x: cx - (cx - o.x) * ratio,
            y: cy - (cy - o.y) * ratio,
          };
        });
        return nextZ;
      });
    }
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
    // F2 정합 — ZOOM_STEPS 는 모듈 상수라 dep 제외. hasImage 만 추적.
  }, [hasImage]);

  // F10 (2026-05-15, 주인님 보고 #26) — iOS Safari 핀치투줌 정합.
  // touch-action: none 만으로는 일부 iOS 버전에서 두-손가락 제스처가 페이지
  // 단위 zoom 으로 흘러가 viewport 내부 이미지 핀치가 무력화되는 회귀.
  // WebKit 의 비표준 gesturestart/gesturechange/gestureend 에 preventDefault
  // 를 거는 것이 표준 우회. 다른 브라우저는 이 이벤트를 발화하지 않아 노옵.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    function block(e: Event) {
      e.preventDefault();
    }
    vp.addEventListener("gesturestart", block as EventListener);
    vp.addEventListener("gesturechange", block as EventListener);
    vp.addEventListener("gestureend", block as EventListener);
    return () => {
      vp.removeEventListener("gesturestart", block as EventListener);
      vp.removeEventListener("gesturechange", block as EventListener);
      vp.removeEventListener("gestureend", block as EventListener);
    };
  }, [hasImage]);

  // F8 (2026-05-15) — 핀치 anchor 보정. 두 손가락 중심점 (viewport 기준) 을
  // anchor 로 잡고 줌 ratio 만큼 offset 도 함께 이동. 핀치 시 손가락이 모이는
  // 지점이 이미지 위에서 고정되는 자연스러운 인터랙션.
  function pinchCenter(
    pts: { x: number; y: number }[],
    rect: DOMRect,
  ): { cx: number; cy: number } {
    const mx = (pts[0].x + pts[1].x) / 2;
    const my = (pts[0].y + pts[1].y) / 2;
    return {
      cx: mx - rect.left - rect.width / 2,
      cy: my - rect.top - rect.height / 2,
    };
  }

  // F11 (2026-05-15) — 핀치 base anchor 재계산을 별도 헬퍼로 추출. pointer
  // down 시점뿐 아니라 3→2 손가락 전이(extra pointer 가 떨어진 직후)에도
  // 사용하여 anchor 가 손가락 중심에 자연스럽게 lock 되도록 한다.
  function rebasePinch(currentZoom: number, currentOffset: { x: number; y: number }) {
    const pinch = pinchStateRef.current;
    if (pinch.pointers.size !== 2) return;
    const pts = [...pinch.pointers.values()];
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    pinch.initialDist = Math.hypot(dx, dy);
    pinch.initialZoom = currentZoom;
    const vp = viewportRef.current;
    if (vp) {
      const { cx, cy } = pinchCenter(pts, vp.getBoundingClientRect());
      pinch.anchorX = cx;
      pinch.anchorY = cy;
      pinch.baseOffsetX = currentOffset.x;
      pinch.baseOffsetY = currentOffset.y;
    }
  }

  // pointer-down — 단일 포인터면 drag pan 시작, 두 번째 포인터면 핀치 진입.
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!hasImage) return;
    // F7 (2026-05-15) — viewport 컨테이너 자체에 pointer capture. e.target 은
    // 자식 img 일 수 있어 unmount 시 capture 누락 가능 — viewport ref 로 통일.
    viewportRef.current?.setPointerCapture?.(e.pointerId);
    const pinch = pinchStateRef.current;
    pinch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch.pointers.size === 2) {
      rebasePinch(zoom, offset);
      dragStateRef.current = null;
      setDragging(false);
      return;
    }

    // F11 (2026-05-15) — 3 손가락 이상 진입 시 핀치 상태 무효화 + 드래그 차단.
    // 종전 코드는 size > 2 면 단일 포인터 분기로 흘러가 마지막 손가락 좌표로
    // dragState 가 덧씌워지는 회귀. 새 포인터를 무시하고 기존 핀치를 유지하되
    // initialDist 를 다음 손가락 leave 까지 0 으로 잠가 점프 방지. dragState
    // 도 명시 정리 — size===2 분기와 정합 (잔여 팬 끼어들기 차단).
    if (pinch.pointers.size > 2) {
      pinch.initialDist = 0;
      dragStateRef.current = null;
      setDragging(false);
      return;
    }

    // 단일 포인터 — 줌 1 이하면 팬 무의미.
    if (zoom <= 1.001) return;
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const pinch = pinchStateRef.current;
    if (pinch.pointers.has(e.pointerId)) {
      pinch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    // F11 — 3+ 손가락 시 핀치 무시. size=2 로 복귀할 때 anchor 재계산 (pointerEnd 정합).
    if (pinch.pointers.size > 2) return;
    if (pinch.pointers.size === 2) {
      const pts = [...pinch.pointers.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);
      // F11 — initialDist 가 0 이면 (3→2 손가락 전이 직후 잠깐) 첫 frame 만 기록.
      // 손가락 떨어지는 찰나의 좌표 jitter 가 ratio 폭주를 유발하지 않도록 한다.
      if (pinch.initialDist <= 0) {
        rebasePinch(zoom, offset);
        return;
      }
      const ratio = dist / pinch.initialDist;
      const target = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, pinch.initialZoom * ratio),
      );
      setZoom(target);
      if (target <= 1.001) {
        setOffset({ x: 0, y: 0 });
      } else {
        // F8 — anchor 기준 offset 갱신. (target / initialZoom) 비율로 base
        // offset 을 anchor 쪽으로 끌어당겨 손가락 중심이 이미지 위에서 고정.
        const r = target / pinch.initialZoom;
        setOffset({
          x: pinch.anchorX - (pinch.anchorX - pinch.baseOffsetX) * r,
          y: pinch.anchorY - (pinch.anchorY - pinch.baseOffsetY) * r,
        });
      }
      return;
    }
    const drag = dragStateRef.current;
    if (!drag) return;
    setOffset({
      x: drag.baseX + (e.clientX - drag.startX),
      y: drag.baseY + (e.clientY - drag.startY),
    });
  }

  function onPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    const pinch = pinchStateRef.current;
    const sizeBefore = pinch.pointers.size;
    const wasPinching = sizeBefore === 2;
    pinch.pointers.delete(e.pointerId);
    // F7 — capture 명시 release. 자동 해제와 별도로 안전망.
    viewportRef.current?.releasePointerCapture?.(e.pointerId);

    // F11 (2026-05-15) — 3+ 손가락에서 한 손가락이 떨어져 size=2 가 되었을 때
    // 핀치 재시작. 남은 두 손가락 좌표 + 현재 zoom/offset 으로 anchor 재계산
    // 하지 않으면 점프 발생. rebasePinch 로 baseline 재설정.
    if (sizeBefore > 2 && pinch.pointers.size === 2) {
      rebasePinch(zoom, offset);
      dragStateRef.current = null;
      setDragging(false);
      return;
    }

    // F3 (2026-05-15) — 핀치 → 단일 손가락 팬 전환. 한 손가락이 떨어진 직후
    // 남은 손가락으로 자연스럽게 팬을 잇는다.
    if (wasPinching && pinch.pointers.size === 1) {
      pinch.initialDist = 0;
      if (zoom > 1.001) {
        const [remaining] = pinch.pointers.values();
        dragStateRef.current = {
          startX: remaining.x,
          startY: remaining.y,
          baseX: offset.x,
          baseY: offset.y,
        };
        setDragging(true);
      }
      return;
    }
    if (pinch.pointers.size < 2) {
      pinch.initialDist = 0;
    }
    dragStateRef.current = null;
    setDragging(false);
  }

  // F1 (2026-05-15) — 사후 리뷰 정합: dep 를 안정 key 로. imageUrls 가 매 렌더
  // 새 reference 라 [imageUrls[0]] 만으로는 ESLint 가 비안전 dep 으로 경고.
  // imageUrls.join("|") 로 배열 전체 변화를 한 토큰에 압축.
  const imageUrlsKey = imageUrls.join("|");
  useEffect(() => {
    setPageIndex(0);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [imageUrlsKey]);

  return (
    <div>
      {/* 헤더 — 출처 | (페이지/줌 컨트롤) | 형식·점수 한 줄. */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          출처{" "}
          <span className="ml-2 normal-case tracking-normal text-foreground/85 font-sans">
            {paperLabel ?? "—"}
          </span>
        </div>

        {hasImage && (
          <div className="inline-flex items-center gap-1 rounded-md border border-rule bg-card/80 px-1 py-1 shadow-sm">
            {pageCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goPage(-1)}
                  disabled={pageIndex === 0}
                  aria-label="이전 페이지"
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary/60 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                </button>
                <span className="text-[10.5px] text-muted-foreground tabular-nums px-1 select-none">
                  {pageIndex + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => goPage(1)}
                  disabled={pageIndex >= pageCount - 1}
                  aria-label="다음 페이지"
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary/60 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
                >
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
                <span className="mx-1 inline-block h-4 w-px bg-rule" aria-hidden />
              </>
            )}
            <button
              type="button"
              onClick={() => canZoomOut && nextStep(-1)}
              disabled={!canZoomOut}
              aria-label="축소"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary/60 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
            >
              <ZoomOut className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span className="text-[10.5px] text-muted-foreground tabular-nums w-9 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => canZoomIn && nextStep(1)}
              disabled={!canZoomIn}
              aria-label="확대"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary/60 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
            >
              <ZoomIn className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span className="mx-1 inline-block h-4 w-px bg-rule" aria-hidden />
            {src && (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="전체화면으로 보기"
                title="전체화면 (모달)"
                className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px]">
          {itemFormat && <Tag>{itemFormat}</Tag>}
          {itemPoints != null && (
            <Tag>
              <span className="tabular-nums">{itemPoints}</span>점
            </Tag>
          )}
        </div>
      </div>

      {/* 뷰포트 — 줌/팬 인터랙션 영역. wheel 은 useEffect 에서 native passive:false 로 부착. */}
      {hasImage && src && (
        <div
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onPointerLeave={onPointerEnd}
          className="relative rounded-md border border-rule overflow-hidden bg-cream-soft select-none touch-none overscroll-contain"
          style={{
            height: "min(70vh, 720px)",
            cursor:
              zoom > 1.001
                ? dragging
                  ? "grabbing"
                  : "grab"
                : "zoom-in",
          }}
          aria-label="시험 본문 PDF 뷰포트 — 휠로 확대축소, 드래그로 이동"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`시험 본문 PDF 페이지 ${pageIndex + 1}/${pageCount}`}
            draggable={false}
            className="absolute left-1/2 top-1/2 max-w-none origin-center transition-transform dark:[filter:brightness(0.85)_contrast(1.15)]"
            style={{
              // translateZ(0) 으로 GPU compositing 강제 → scale transform 보간이
              // 일관되게 high-quality 경로를 타도록 한다.
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) translateZ(0) scale(${zoom})`,
              transitionDuration: dragging ? "0ms" : "120ms",
              width: "100%",
              height: "auto",
              willChange: "transform",
              imageRendering: "auto",
              backfaceVisibility: "hidden",
            }}
            loading="lazy"
          />
        </div>
      )}

      {/* 백승환 피드백 #2 (2026-05-15) — 전체화면 모달. 새 탭 이탈 대신 in-app
          lightbox 로 학습 흐름 보존. itemNo 는 paperLabel("…N번") 끝의 숫자를
          정규식으로 추출 — formatPaperLabel(queries.ts) 출력 형식 정합. */}
      {src && (
        <ExamItemLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          itemNo={extractItemNo(paperLabel)}
          imageUrl={src}
          stemText={stemText}
          paperLabel={paperLabel ?? ""}
          initialMode="image"
        />
      )}
    </div>
  );
}

// 키워드 트랙 전용 정리 노트 박스. 폰트 줌 + 형광펜 + 블라인드 보존.
// quiz/mistake 트랙은 AnalysisPanel/ReferenceTab 으로 격상.
function KeywordNoteBox({
  markdown,
  source,
  cardId,
  highlights,
  blindMode,
  onToggleBlind,
}: {
  markdown: string;
  source: AnswerSource;
  cardId: string;
  highlights: CardHighlight[];
  blindMode: boolean;
  onToggleBlind: () => void;
}) {
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
  const layerRef = useRef<HighlightLayerHandle | null>(null);
  // F4 (2026-05-15) — selection 비었을 때 안내 토스트. aria-live=polite.
  const [hint, setHint] = useState<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);
  function applyColor(c: "yellow" | "green" | "pink" | "underline") {
    const ok = layerRef.current?.applyColorToSelection(c);
    if (!ok) {
      setHint("본문에서 텍스트를 드래그한 뒤 버튼을 눌러 주세요.");
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setHint(null), 2400);
    }
  }

  return (
    <Card className="border-l-4 border-evergreen border-y border-r border-rule bg-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-evergreen">
            정리 노트
          </span>
          <SourceBadge source={source} />
          <span className="ml-auto inline-flex items-center gap-1.5">
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
            {/* 주인님 보고 #5 (2026-05-14) — 키워드 트랙에도 형광펜·밑줄 진입점. */}
            <NoteToolButton label="노랑" tone="yellow" onClick={() => applyColor("yellow")} />
            <NoteToolButton label="초록" tone="green" onClick={() => applyColor("green")} />
            <NoteToolButton label="분홍" tone="pink" onClick={() => applyColor("pink")} />
            <NoteToolButton label="밑줄" tone="underline" onClick={() => applyColor("underline")} />
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
          </span>
        </div>
        {/* F4 — selection 비어 있을 때 안내 토스트. */}
        <div
          role="status"
          aria-live="polite"
          className={`mt-2 text-[11px] text-muted-foreground transition-opacity duration-200 ${
            hint ? "opacity-100" : "opacity-0 h-0"
          }`}
        >
          {hint}
        </div>
        <div
          className="mt-3 [font-variant-numeric:tabular-nums] tabular-nums origin-top-left [&_*]:![font-size:inherit] [&_*]:![line-height:1.65]"
          style={{ fontSize: `${Math.round(zoom * 14)}px` }}
        >
          <HighlightLayer
            ref={layerRef}
            cardId={cardId}
            surface="back_md"
            initialHighlights={highlights}
          >
            <Markdown serif blind={blindMode}>
              {markdown}
            </Markdown>
          </HighlightLayer>
        </div>
      </CardContent>
    </Card>
  );
}

function NoteToolButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "yellow" | "green" | "pink" | "underline";
  onClick: () => void;
}) {
  const dot =
    tone === "yellow"
      ? "bg-yellow-300"
      : tone === "green"
        ? "bg-emerald-300"
        : tone === "pink"
          ? "bg-pink-300"
          : "bg-foreground/60";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} — 선택한 텍스트에 적용`}
      title={`${label} — 드래그한 텍스트에 적용`}
      className="inline-flex h-8 px-2 items-center gap-1 rounded border border-rule text-muted-foreground hover:text-foreground hover:bg-secondary/60 text-[11px] transition-colors"
    >
      {tone === "underline" ? (
        <UnderlineIcon className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <span aria-hidden className={`block h-2.5 w-2.5 rounded-full ${dot}`} />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-rule px-2 py-0.5 text-muted-foreground">
      {children}
    </span>
  );
}

// 헌법 §30의2 4계층 출처 배지 (M4, PR-11, 2026-05-15).
function SourceBadge({ source }: { source: AnswerSource }) {
  if (source === "official") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[10.5px] text-info">
        <CheckCircle2 className="h-3 w-3" />
        검증됨
      </span>
    );
  }
  if (source === "crowd_verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-evergreen/10 px-2 py-0.5 text-[10.5px] text-evergreen">
        <CheckCircle2 className="h-3 w-3" />
        교차 검증
      </span>
    );
  }
  if (source === "user_self_corrected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10.5px] text-foreground/70">
        <ShieldCheck className="h-3 w-3" />
        본인 정정
      </span>
    );
  }
  // ai_estimate (기본)
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10.5px] text-warning-text">
      <ShieldCheck className="h-3 w-3" />
      AI 추정
    </span>
  );
}
