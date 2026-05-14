"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
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
import { HighlightLayer, type HighlightLayerHandle } from "./highlight-layer";
import { Underline as UnderlineIcon } from "lucide-react";
import { CardTags } from "./card-tags";
import { WorkspaceTopbar } from "./workspace-topbar";
import { AnalysisPanel } from "./analysis-panel";
import { AssistantFab } from "./assistant-fab";

type CardData = {
  id: string;
  type: CardType;
  frontText: string;
  frontImagePath: string | null;
  frontImagePaths: string[];
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

  // ProblemPane — 본문 + (작성 중) 답안 textarea + (채점 후) 내 답안 readonly.
  const problemPane = (
    <div className="space-y-4">
      {stemCard}

      {showAnswerInput && (
        <Card className="border-rule">
          <CardContent className="p-5">
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

      {/* 채점 후 — 사용자가 작성한 답안을 readonly 박스로 좌측에 보존.
          AnalysisPanel(우측) 의 모범답안과 좌우 비교 가능. */}
      {revealed && answer.trim().length > 0 && (
        <Card className="border-l-4 border-rule-strong border-y border-r border-rule bg-card">
          <CardContent className="p-5">
            <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
              내 답안
            </span>
            <div className="mt-3 font-sans text-[13.5px] leading-[1.75] whitespace-pre-wrap text-foreground/90">
              {answer}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const sessionProgressPct = Math.min(100, sessionCount * 8);

  return (
    <div className="space-y-4">
      {/* 헌법 v3.5.1 제16조 — 카드 메타 영역. 사용자 커스텀 해시태그. */}
      <CardTags cardId={card.id} initialTags={tags} />

      {isWorkspaceTrack && (
        <>
          <WorkspaceTopbar
            track={card.type}
            paperLabel={card.paperLabel}
            itemFormat={card.itemFormat}
            itemPoints={card.itemPoints}
            sessionCount={sessionCount}
            revealed={revealed}
          />

          {/* SplitView — ProblemPane (좌) | AnalysisPanel (우).
              xl(≥1280px) 이상에서 활성, 미만은 vertical stack fallback. */}
          <div ref={analysisAnchorRef} className="scroll-mt-4">
            <SplitView
              storageKey={`study-${card.type}`}
              left={problemPane}
              right={
                <AnalysisPanel
                  revealed={revealed}
                  cardId={card.id}
                  backMd={card.backMd}
                  verifiedAnswer={card.verifiedAnswer}
                  highlights={highlights}
                  blindMode={blindMode}
                  onToggleBlind={toggleBlind}
                  userAnswer={answer}
                />
              }
              stickyLeft
              stickyTop="top-[96px]"
              defaultRatio={0.5}
              minRatio={0.35}
              maxRatio={0.65}
              ariaLabel="본문 / 분석 분할 비율"
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
              verified={card.verifiedAnswer}
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

      {/* v3.5.2 (2026-05-14) — 자가 채점 sticky 슬림화 (PR #36). */}
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

      {/* 헌법 v3.6.1 §16 단서 — 학습 본업(풀이 트랙) 한정 AI 학습 도우미.
          fixed 진입점이라 SplitView 외부, 페이지 우측 하단 floating. */}
      {isWorkspaceTrack && (
        <AssistantFab cardId={card.id} userAnswer={answer} />
      )}
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
//   - 줌 단계: 0.6 / 0.8 / 1 / 1.25 / 1.5 / 2 / 3.
//   - 헤더에 출처 · 컨트롤 · 점수 한 줄. 컨트롤은 페이지 네비 + 줌 통합.
//   - 마우스 드래그(좌클릭 hold) 또는 단일 터치로 팬, 줌 ≥ 1.05 일 때만 활성.
//   - PC 휠(deltaY) 로 줌 — Ctrl 미요구. preventDefault 로 페이지 스크롤 잠금.
//   - 휠 줌은 커서 위치 기준 anchor — 자연스러운 확대 체감.
function PdfViewer({
  imageUrls,
  paperLabel,
  itemFormat,
  itemPoints,
}: {
  imageUrls: string[];
  paperLabel: string | null;
  itemFormat: string | null;
  itemPoints: number | null;
}) {
  // 주인님 보고 #24 (2026-05-15) — 1 미만(0.6/0.8)으로 축소 시 transform scale
  // 보간이 거칠어 본문 텍스트가 깨져 보이던 회귀. base 가 이미 viewport 폭에
  // 맞춰진 1.0 이라 더 작게 만들 동기도 약함 — 최저값을 1 로 끌어올린다.
  const ZOOM_STEPS = [1, 1.25, 1.5, 2, 3];
  const MIN_ZOOM = ZOOM_STEPS[0];
  const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1];
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  // pointer drag pan — pointer 단일 모델로 마우스 + 터치 + 펜 통일.
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  // 핀치 줌 — 활성 pointer 2개 트래킹.
  const pinchStateRef = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    initialDist: number;
    initialZoom: number;
  }>({ pointers: new Map(), initialDist: 0, initialZoom: 1 });

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
      const cur = idx === -1
        ? ZOOM_STEPS.reduce((best, s) =>
            Math.abs(s - z) < Math.abs(best - z) ? s : best, ZOOM_STEPS[0])
        : z;
      const curIdx = ZOOM_STEPS.indexOf(cur);
      const nextIdx = Math.max(
        0,
        Math.min(ZOOM_STEPS.length - 1, curIdx + direction),
      );
      const nextZ = ZOOM_STEPS[nextIdx];
      // 줌 1 이하로 복귀하면 팬 오프셋 리셋 — UX 직관 (전체 화면 복귀).
      if (nextZ <= 1.001) setOffset({ x: 0, y: 0 });
      return nextZ;
    });
  }, [ZOOM_STEPS]);

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
  }, [ZOOM_STEPS, hasImage]);

  // pointer-down — 단일 포인터면 drag pan 시작, 두 번째 포인터면 핀치 진입.
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!hasImage) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const pinch = pinchStateRef.current;
    pinch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch.pointers.size === 2) {
      const pts = [...pinch.pointers.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      pinch.initialDist = Math.hypot(dx, dy);
      pinch.initialZoom = zoom;
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
    if (pinch.pointers.size === 2) {
      const pts = [...pinch.pointers.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);
      if (pinch.initialDist > 0) {
        const ratio = dist / pinch.initialDist;
        const target = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, pinch.initialZoom * ratio),
        );
        setZoom(target);
        if (target <= 1.001) setOffset({ x: 0, y: 0 });
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
    pinch.pointers.delete(e.pointerId);
    if (pinch.pointers.size < 2) {
      pinch.initialDist = 0;
    }
    dragStateRef.current = null;
    setDragging(false);
  }

  // 카드 ID 가 바뀌면 (페이지 전환과 무관하게) 자동 리셋 보강.
  useEffect(() => {
    setPageIndex(0);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [imageUrls[0]]);

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
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="새 탭에서 전체 크기로 보기"
                className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              </a>
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
    </div>
  );
}

// 키워드 트랙 전용 정리 노트 박스. 폰트 줌 + 형광펜 + 블라인드 보존.
// quiz/mistake 트랙은 AnalysisPanel/ReferenceTab 으로 격상.
function KeywordNoteBox({
  markdown,
  verified,
  cardId,
  highlights,
  blindMode,
  onToggleBlind,
}: {
  markdown: string;
  verified: boolean;
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
  function applyColor(c: "yellow" | "green" | "pink" | "underline") {
    layerRef.current?.applyColorToSelection(c);
  }

  return (
    <Card className="border-l-4 border-evergreen border-y border-r border-rule bg-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-evergreen">
            정리 노트
          </span>
          <SourceBadge verified={verified} />
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
