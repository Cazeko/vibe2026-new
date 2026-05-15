"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpenCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  GitCompare,
  History,
  KeyRound,
  Lock,
  Minus,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Underline as UnderlineIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/shared/markdown";
import type { CardHighlight } from "@/lib/db/queries";
import type {
  OverviewJson,
  KeywordsJson,
  DiffJson,
} from "@/lib/db/schema/user-card-ai-analysis";
import { HighlightLayer, type HighlightLayerHandle } from "./highlight-layer";
import { requestAiAnalysis } from "../actions";

// 헌법 v3.5.3 §16 + 2026-05-14 brainstorming PR 1/3 — 워크스페이스 분석 패널.
// PR 1 골격 + PR 3 OverviewTab 활성화.
//
// 5탭 구성
// - overview     : AI 총평 [PR 3 활성] — 강점/보완점/누락 키워드 카드
// - keywords     : 키워드 비교 [PR 4 대기]
// - diff         : 답안 diff [PR 5 대기]
// - reference    : 모범답안 — PR 1 활성
// - explanation  : 해설 — PR 1 placeholder
//
// 잠금 정책
// - 채점 전(revealed === false) — 전체 잠금, 자물쇠 + "채점 후 활성화" 안내
// - 채점 후 — overview 자동 활성. unlocked 가 false 인 탭은 "준비 중".

type TabKey = "overview" | "keywords" | "diff" | "reference" | "explanation" | "history";

type TabSpec = {
  key: TabKey;
  label: string;
  Icon: typeof Sparkles;
  unlocked: boolean;
};

// 백승환 #8 (2026-05-15) — "이력" 탭 추가. 채점과 무관하게 unlocked
// (이전 시도가 있다면 채점 전에도 검토 가능 — 동일 카드 재학습 시 유용).
const TABS: TabSpec[] = [
  { key: "overview", label: "AI 총평", Icon: Sparkles, unlocked: true },
  { key: "keywords", label: "키워드 비교", Icon: KeyRound, unlocked: true },
  { key: "diff", label: "답안 비교", Icon: GitCompare, unlocked: true },
  { key: "reference", label: "모범답안", Icon: BookOpenCheck, unlocked: true },
  { key: "explanation", label: "해설", Icon: FileText, unlocked: true },
  { key: "history", label: "이력", Icon: History, unlocked: true },
];

type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; reason: string }
  | {
      status: "done";
      overview: OverviewJson;
      keywords: KeywordsJson;
      diff: DiffJson;
      cached: boolean;
    };

type AttemptRecord = {
  id: string;
  answerMd: string;
  selfGrade: string | null;
  attemptedAt: string;
};

type Props = {
  revealed: boolean;
  cardId: string;
  backMd: string | null;
  verifiedAnswer: boolean;
  highlights: CardHighlight[];
  blindMode: boolean;
  onToggleBlind: () => void;
  userAnswer: string;
  attemptHistory?: AttemptRecord[];
};

export function AnalysisPanel({
  revealed,
  cardId,
  backMd,
  verifiedAnswer,
  highlights,
  blindMode,
  onToggleBlind,
  userAnswer,
  attemptHistory = [],
}: Props) {
  const [active, setActive] = useState<TabKey>("overview");
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "idle" });
  // 채점 직후 1회 overview 강제. 사용자가 reference 클릭한 뒤에는 그대로 유지.
  const switchedRef = useRef(false);

  // 카드 전환 시 분석 상태 리셋.
  useEffect(() => {
    setAnalysis({ status: "idle" });
    switchedRef.current = false;
  }, [cardId]);

  // 채점 시점에 overview 강제 활성 (1회).
  useEffect(() => {
    if (!revealed) {
      switchedRef.current = false;
      return;
    }
    if (!switchedRef.current) {
      setActive("overview");
      switchedRef.current = true;
    }
  }, [revealed]);

  // AI 분석 fetch — 채점 후 자동 트리거.
  useEffect(() => {
    if (!revealed) return;
    if (!backMd) return;
    let cancelled = false;
    setAnalysis({ status: "loading" });
    requestAiAnalysis(cardId, userAnswer).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setAnalysis({
          status: "done",
          overview: res.overview,
          keywords: res.keywords,
          diff: res.diff,
          cached: res.cached,
        });
      } else {
        setAnalysis({ status: "error", reason: res.error });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [revealed, cardId, userAnswer, backMd]);

  return (
    <Card className="border-rule">
      {/* 탭 바 */}
      <div className="border-b border-rule px-2 pt-2">
        <div
          role="tablist"
          aria-label="학습 분석 탭"
          className="flex items-center gap-0.5 overflow-x-auto"
        >
          {TABS.map((tab) => {
            const isActive = active === tab.key;
            // 백승환 #8 — "이력" 은 채점 게이트 면제 (이전 시도 검토는 항상 가능).
            const isAlwaysOpen = tab.key === "history";
            const locked = !isAlwaysOpen && (!revealed || !tab.unlocked);
            const lockReason = !revealed
              ? "채점 후 활성화"
              : !tab.unlocked
                ? "준비 중"
                : "";
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`analysis-panel-${tab.key}`}
                disabled={locked}
                onClick={() => !locked && setActive(tab.key)}
                title={locked ? lockReason : tab.label}
                className={`inline-flex shrink-0 items-center gap-1.5 -mb-px rounded-t-sm border-b-[3px] px-3 py-2 text-[11.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 ${
                  isActive
                    ? "border-evergreen font-bold text-evergreen"
                    : locked
                      ? "border-transparent text-muted-foreground/60 cursor-not-allowed"
                      : "border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                }`}
              >
                {locked ? (
                  <Lock className="h-3 w-3" aria-hidden />
                ) : (
                  <tab.Icon className="h-3.5 w-3.5" aria-hidden />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 패널 본문. 백승환 #8 — "이력" 탭은 채점 무관 항상 노출.
          그 외 탭은 LockedPanel 게이트 유지 (기존 정합). */}
      <CardContent className="p-5">
        {active === "history" ? (
          <AttemptHistoryTab
            attempts={attemptHistory}
            currentAnswer={userAnswer}
          />
        ) : !revealed ? (
          <LockedPanel />
        ) : active === "overview" ? (
          <OverviewTab analysis={analysis} hasReference={!!backMd} />
        ) : active === "keywords" ? (
          <KeywordsTab analysis={analysis} hasReference={!!backMd} />
        ) : active === "diff" ? (
          <DiffTab analysis={analysis} hasReference={!!backMd} />
        ) : active === "reference" ? (
          <ReferenceTab
            cardId={cardId}
            backMd={backMd}
            verifiedAnswer={verifiedAnswer}
            highlights={highlights}
            blindMode={blindMode}
            onToggleBlind={onToggleBlind}
          />
        ) : active === "explanation" ? (
          <ExplanationPlaceholder />
        ) : (
          <ComingSoonPanel tab={active} />
        )}
      </CardContent>
    </Card>
  );
}

function LockedPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <span
        aria-hidden
        className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-cream-deep text-muted-foreground"
      >
        <Lock className="h-5 w-5" />
      </span>
      <p className="font-serif text-[15px] font-medium tracking-tight">
        채점 후 분석이 활성화됩니다
      </p>
      <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
        답안을 작성하고 좌측 하단의 채점 버튼을 누르면
        <br />
        모범답안·해설·AI 분석이 순차적으로 열립니다.
      </p>
    </div>
  );
}

// 헌법 §3의2 (정직성) — 점수 표기 X. 강점·보완점·누락 키워드 정성 카드만.
function OverviewTab({
  analysis,
  hasReference,
}: {
  analysis: AnalysisState;
  hasReference: boolean;
}) {
  if (!hasReference) {
    return (
      <div className="flex items-start gap-3 rounded-md border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-warning" aria-hidden />
        <p className="text-[12.5px] leading-relaxed text-foreground/80">
          모범답안이 시드되지 않아 AI 총평을 생성할 수 없습니다. 시드 후 다시
          채점하면 자동으로 분석이 표시됩니다.
        </p>
      </div>
    );
  }

  if (analysis.status === "idle" || analysis.status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2
          className="h-6 w-6 animate-spin text-evergreen"
          aria-hidden
        />
        <p className="mt-3 text-[13px] font-medium text-foreground/85">
          AI 가 답안을 분석하고 있습니다
        </p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">
          보통 10초 이내에 완료됩니다.
        </p>
      </div>
    );
  }

  if (analysis.status === "error") {
    return (
      <div className="flex items-start gap-3 rounded-md border-l-[3px] border-l-error border-y border-r border-rule bg-secondary/30 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-error" aria-hidden />
        <div className="text-[12.5px] leading-relaxed text-foreground/80">
          AI 분석에 일시적으로 실패했습니다.
          <br />
          잠시 후 다시 채점하거나 모범답안 탭에서 직접 비교해 주세요.
          <span className="ml-2 text-muted-foreground tabular-nums text-[10.5px]">
            ({analysis.reason})
          </span>
        </div>
      </div>
    );
  }

  const { strengths, improvements, missing_keywords } = analysis.overview;
  const empty =
    strengths.length === 0 &&
    improvements.length === 0 &&
    missing_keywords.length === 0;

  if (empty) {
    return (
      <div className="flex items-start gap-3 rounded-md border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-warning" aria-hidden />
        <p className="text-[12.5px] leading-relaxed text-foreground/80">
          분석 결과가 비어 있습니다. 답안을 다시 작성해 주시거나 모범답안 탭에서
          직접 비교해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <FeedbackCard
        tone="evergreen"
        label="강점"
        items={strengths}
        emptyHint="이번 답안에서 두드러진 강점이 잡히지 않았습니다."
      />
      <FeedbackCard
        tone="warning"
        label="보완점"
        items={improvements}
        emptyHint="추가로 보완할 점이 보이지 않습니다."
      />
      <FeedbackCard
        tone="error"
        label="누락 키워드"
        items={missing_keywords}
        emptyHint="모범답안의 핵심 키워드가 모두 포함되었습니다."
        chip
      />
      {analysis.cached && (
        <p className="text-[10.5px] text-muted-foreground tabular-nums text-right">
          캐시된 결과를 표시 중입니다.
        </p>
      )}
    </div>
  );
}

function FeedbackCard({
  tone,
  label,
  items,
  emptyHint,
  chip = false,
}: {
  tone: "evergreen" | "warning" | "error";
  label: string;
  items: string[];
  emptyHint: string;
  chip?: boolean;
}) {
  const accent =
    tone === "evergreen"
      ? "border-l-evergreen"
      : tone === "warning"
        ? "border-l-warning"
        : "border-l-error";
  const labelText =
    tone === "evergreen"
      ? "text-evergreen"
      : tone === "warning"
        ? "text-warning-text"
        : "text-error";
  return (
    <div
      className={`rounded-md border-l-[3px] ${accent} border-y border-r border-rule bg-card p-4`}
    >
      <p
        className={`text-[10.5px] uppercase tracking-[0.12em] ${labelText}`}
      >
        {label}
      </p>
      {items.length === 0 ? (
        <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">
          {emptyHint}
        </p>
      ) : chip ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <span
              key={`${it}-${i}`}
              className="inline-flex items-center rounded-full bg-error/10 px-2 py-0.5 text-[11.5px] text-error"
            >
              {it}
            </span>
          ))}
        </div>
      ) : (
        <ul className="mt-2 space-y-1.5 text-[12.5px] text-foreground/90 leading-[1.65]">
          {items.map((it, i) => (
            <li key={`${label}-${i}`} className="flex gap-2">
              <span className="mt-[7px] block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 헌법 §3의2 — 모범답안 키워드 vs 사용자 답안 매칭. ✔ matched / ✘ missing.
// 정직성 정합으로 "n개 중 m개" 매칭 카운트만 표기. 비율(%) 표기 X.
function KeywordsTab({
  analysis,
  hasReference,
}: {
  analysis: AnalysisState;
  hasReference: boolean;
}) {
  if (!hasReference) {
    return (
      <div className="flex items-start gap-3 rounded-md border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-warning" aria-hidden />
        <p className="text-[12.5px] leading-relaxed text-foreground/80">
          모범답안이 시드되지 않아 키워드 비교를 표시할 수 없습니다.
        </p>
      </div>
    );
  }

  if (analysis.status === "idle" || analysis.status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-evergreen" aria-hidden />
        <p className="mt-3 text-[13px] font-medium text-foreground/85">
          키워드를 비교하고 있습니다
        </p>
      </div>
    );
  }

  if (analysis.status === "error") {
    return (
      <div className="flex items-start gap-3 rounded-md border-l-[3px] border-l-error border-y border-r border-rule bg-secondary/30 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-error" aria-hidden />
        <p className="text-[12.5px] leading-relaxed text-foreground/80">
          AI 분석에 일시적으로 실패했습니다.
          <br />
          잠시 후 다시 채점하거나 모범답안 탭에서 직접 비교해 주세요.
        </p>
      </div>
    );
  }

  const refs = analysis.keywords.reference;

  if (refs.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-md border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-warning" aria-hidden />
        <p className="text-[12.5px] leading-relaxed text-foreground/80">
          모범답안에서 핵심 키워드가 추출되지 않았습니다. 답안을 다시 채점하거나
          모범답안 탭을 참고해 주세요.
        </p>
      </div>
    );
  }

  const matched = refs.filter((k) => k.matched).length;
  const missing = refs.length - matched;

  return (
    <div className="space-y-3">
      {/* 요약 라인 — 정성 매칭 카운트만. 비율(%) 미표기. */}
      <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
        <span className="uppercase tracking-[0.12em] text-[10.5px]">
          핵심 키워드
        </span>
        <span className="tabular-nums text-foreground/85">
          총 <span className="font-medium">{refs.length}</span>개
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-evergreen/10 px-2 py-0.5 text-evergreen">
          <Check className="h-3 w-3" aria-hidden />
          포함 <span className="tabular-nums font-medium">{matched}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 text-error">
          <Minus className="h-3 w-3" aria-hidden />
          누락 <span className="tabular-nums font-medium">{missing}</span>
        </span>
        {analysis.cached && (
          <span className="ml-auto text-[10.5px] text-muted-foreground">
            캐시된 결과
          </span>
        )}
      </div>

      {/* 매트릭스 — 키워드 단위 row. */}
      <ul
        className="divide-y divide-rule rounded-md border border-rule overflow-hidden bg-card"
        aria-label="모범답안 키워드 매칭 매트릭스"
      >
        {refs.map((k, i) => (
          <li
            key={`${k.text}-${i}`}
            className="flex items-center gap-3 px-3.5 py-2"
          >
            <span
              aria-hidden
              className={`grid h-6 w-6 place-items-center rounded-full ${
                k.matched
                  ? "bg-evergreen/15 text-evergreen"
                  : "bg-error/15 text-error"
              }`}
            >
              {k.matched ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
            </span>
            <span
              className={`flex-1 text-[12.5px] leading-relaxed ${
                k.matched ? "text-foreground/90" : "text-foreground/75"
              }`}
            >
              {k.text}
            </span>
            <span
              className={`text-[10.5px] uppercase tracking-[0.1em] ${
                k.matched ? "text-evergreen" : "text-error"
              }`}
            >
              {k.matched ? "포함" : "누락"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 헌법 §3의2 + Cursor 스타일 라인 단위 diff.
// 색상 정합 (DESIGN.md §4.3 / 헌법 §16의2)
//   common  — 무색, 본문 톤
//   missing — evergreen (모범답안에 있고 학습자 답안에 없음 → 추가해야 할 부분)
//   extra   — warning (학습자 답안에만 있음 → 모범에는 없는 내용)
// 좌측 게터에 +/=/- 기호로 git diff 시각화.
function DiffTab({
  analysis,
  hasReference,
}: {
  analysis: AnalysisState;
  hasReference: boolean;
}) {
  if (!hasReference) {
    return (
      <div className="flex items-start gap-3 rounded-md border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-warning" aria-hidden />
        <p className="text-[12.5px] leading-relaxed text-foreground/80">
          모범답안이 시드되지 않아 답안 비교를 표시할 수 없습니다.
        </p>
      </div>
    );
  }

  if (analysis.status === "idle" || analysis.status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-evergreen" aria-hidden />
        <p className="mt-3 text-[13px] font-medium text-foreground/85">
          답안 차이를 분석하고 있습니다
        </p>
      </div>
    );
  }

  if (analysis.status === "error") {
    return (
      <div className="flex items-start gap-3 rounded-md border-l-[3px] border-l-error border-y border-r border-rule bg-secondary/30 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-error" aria-hidden />
        <p className="text-[12.5px] leading-relaxed text-foreground/80">
          AI 분석에 일시적으로 실패했습니다.
          <br />
          잠시 후 다시 채점하거나 모범답안 탭에서 직접 비교해 주세요.
        </p>
      </div>
    );
  }

  const { segments } = analysis.diff;

  if (segments.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-md border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-warning" aria-hidden />
        <p className="text-[12.5px] leading-relaxed text-foreground/80">
          비교할 텍스트가 추출되지 않았습니다. 모범답안 탭에서 직접 비교해
          주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 범례 */}
      <div className="flex items-center gap-2 flex-wrap text-[10.5px] text-muted-foreground">
        <span className="uppercase tracking-[0.12em]">범례</span>
        <LegendChip tone="common" label="공통" sign="=" />
        <LegendChip tone="missing" label="모범 — 추가 필요" sign="+" />
        <LegendChip tone="extra" label="답안 — 모범 외" sign="−" />
        {analysis.cached && (
          <span className="ml-auto text-[10.5px] text-muted-foreground">
            캐시된 결과
          </span>
        )}
      </div>

      {/* 라인 단위 diff */}
      <div
        className="rounded-md border border-rule overflow-hidden bg-card font-mono"
        aria-label="모범답안 답안 라인 단위 비교"
      >
        {segments.map((seg, i) => (
          <DiffLine key={i} segment={seg} />
        ))}
      </div>
    </div>
  );
}

function DiffLine({
  segment,
}: {
  segment: { type: "common" | "missing" | "extra"; text: string };
}) {
  const { type, text } = segment;
  const sign = type === "missing" ? "+" : type === "extra" ? "−" : "=";
  // 색 토큰
  //   missing — evergreen 좌측 막대 + 미세 배경 (강조 — "모범에 있는 내용")
  //   extra   — warning 좌측 막대 + 미세 배경 (모범에 없는 내용)
  //   common  — rule 좌측 막대, 배경 없음
  const tone =
    type === "missing"
      ? "border-l-evergreen bg-evergreen/5"
      : type === "extra"
        ? "border-l-warning bg-warning/5"
        : "border-l-rule";
  const signColor =
    type === "missing"
      ? "text-evergreen"
      : type === "extra"
        ? "text-warning-text"
        : "text-muted-foreground/60";
  const bodyColor =
    type === "missing"
      ? "text-foreground/95"
      : type === "extra"
        ? "text-foreground/85"
        : "text-foreground/80";
  return (
    <div
      className={`flex gap-3 border-l-[3px] ${tone} px-3 py-1.5 text-[12.5px] leading-[1.65]`}
    >
      <span
        aria-hidden
        className={`shrink-0 w-3 text-center tabular-nums select-none ${signColor}`}
      >
        {sign}
      </span>
      <span className={`flex-1 whitespace-pre-wrap break-words ${bodyColor}`}>
        {text}
      </span>
    </div>
  );
}

function LegendChip({
  tone,
  label,
  sign,
}: {
  tone: "common" | "missing" | "extra";
  label: string;
  sign: string;
}) {
  const cls =
    tone === "missing"
      ? "border-evergreen/40 text-evergreen"
      : tone === "extra"
        ? "border-warning/40 text-warning-text"
        : "border-rule text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${cls}`}
    >
      <span className="tabular-nums">{sign}</span>
      <span>{label}</span>
    </span>
  );
}

function ReferenceTab({
  cardId,
  backMd,
  verifiedAnswer,
  highlights,
  blindMode,
  onToggleBlind,
}: {
  cardId: string;
  backMd: string | null;
  verifiedAnswer: boolean;
  highlights: CardHighlight[];
  blindMode: boolean;
  onToggleBlind: () => void;
}) {
  const layerRef = useRef<HighlightLayerHandle | null>(null);
  // F4 (2026-05-15) — selection 비어 있을 때 형광펜 버튼 입력에 가벼운 토스트.
  // aria-live=polite 로 스크린리더 호환.
  const [hint, setHint] = useState<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);
  function applyColor(color: "yellow" | "green" | "pink" | "underline") {
    const ok = layerRef.current?.applyColorToSelection(color);
    if (!ok) {
      setHint("본문에서 텍스트를 드래그한 뒤 버튼을 눌러 주세요.");
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setHint(null), 2400);
    }
  }

  if (!backMd) {
    return (
      <div className="flex items-start gap-3 rounded-md border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-warning" aria-hidden />
        <p className="text-[12.5px] leading-relaxed text-foreground/80">
          본 카드의 모범답안이 아직 시드되지 않았습니다. 운영자 시드 후 자동 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10.5px] uppercase tracking-[0.12em] text-evergreen">
          모범답안
        </span>
        <SourceBadge verified={verifiedAnswer} />
        <div className="ml-auto inline-flex items-center gap-1.5">
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
          <HighlightToolButton
            label="노랑"
            ariaLabel="선택한 텍스트에 노랑 형광펜"
            tone="yellow"
            onClick={() => applyColor("yellow")}
          />
          <HighlightToolButton
            label="초록"
            ariaLabel="선택한 텍스트에 초록 형광펜"
            tone="green"
            onClick={() => applyColor("green")}
          />
          <HighlightToolButton
            label="분홍"
            ariaLabel="선택한 텍스트에 분홍 형광펜"
            tone="pink"
            onClick={() => applyColor("pink")}
          />
          <HighlightToolButton
            label="밑줄"
            ariaLabel="선택한 텍스트에 밑줄"
            tone="underline"
            onClick={() => applyColor("underline")}
          />
        </div>
      </div>

      {/* F4 — selection 비어 있을 때 안내 토스트 (aria-live). */}
      <div
        role="status"
        aria-live="polite"
        className={`text-[11px] text-muted-foreground transition-opacity duration-200 ${
          hint ? "opacity-100" : "opacity-0 h-0"
        }`}
      >
        {hint}
      </div>

      <div className="rounded-md border-l-4 border-evergreen border-y border-r border-rule bg-card p-4">
        <HighlightLayer
          ref={layerRef}
          cardId={cardId}
          surface="back_md"
          initialHighlights={highlights}
        >
          <Markdown serif blind={blindMode}>
            {backMd}
          </Markdown>
        </HighlightLayer>
      </div>
    </div>
  );
}

function HighlightToolButton({
  label,
  ariaLabel,
  tone,
  onClick,
}: {
  label: string;
  ariaLabel: string;
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
      aria-label={ariaLabel}
      title={`${label} — 드래그한 텍스트에 적용`}
      className="inline-flex items-center gap-1 h-8 px-2 rounded border border-rule text-muted-foreground hover:text-foreground hover:bg-secondary/60 text-[11px] transition-colors"
    >
      {tone === "underline" ? (
        <UnderlineIcon className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <span
          aria-hidden
          className={`block h-2.5 w-2.5 rounded-full ${dot}`}
        />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ExplanationPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span
        aria-hidden
        className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-secondary/60 text-muted-foreground"
      >
        <FileText className="h-5 w-5" />
      </span>
      <p className="font-serif text-[14px] font-medium tracking-tight">
        해설 시드 분리 예정
      </p>
      <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-muted-foreground">
        현재는 모범답안 탭에 풀이 흐름이 함께 포함되어 있습니다.
        <br />
        해설 전용 본문은 시드 파이프라인 분리 후 표시됩니다.
      </p>
    </div>
  );
}

function ComingSoonPanel({ tab }: { tab: TabKey }) {
  const label = TABS.find((t) => t.key === tab)?.label ?? "분석";
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="font-serif text-[14px] font-medium tracking-tight">
        {label} 준비 중
      </p>
      <p className="mt-2 text-[12px] text-muted-foreground">
        다음 업데이트에서 활성화됩니다.
      </p>
    </div>
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

// 백승환 #8 (2026-05-15) — 답안 시도 이력 탭.
// 가장 최근 시도부터 노출. 클릭 시 펼쳐 본문 비교. 현재 작성 중 답안과
// 첫 번째 이력의 글자수·등급 차이를 한눈에 표기.
function AttemptHistoryTab({
  attempts,
  currentAnswer,
}: {
  attempts: AttemptRecord[];
  currentAnswer: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(
    attempts[0]?.id ?? null,
  );

  if (attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span
          aria-hidden
          className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-cream-deep text-muted-foreground"
        >
          <History className="h-5 w-5" />
        </span>
        <p className="font-serif text-[14px] font-medium tracking-tight">
          시도 이력이 없습니다
        </p>
        <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-muted-foreground">
          답안을 작성하고 채점하면
          <br />
          이 카드의 시도 이력이 여기에 누적됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          시도 이력 — 최근 {attempts.length}건
        </p>
        {currentAnswer.trim().length > 0 && (
          <p className="text-[10.5px] text-muted-foreground tabular-nums">
            현재 작성: {currentAnswer.length}자
          </p>
        )}
      </div>
      <ol className="space-y-2">
        {attempts.map((a, idx) => {
          const isExpanded = expandedId === a.id;
          const date = new Date(a.attemptedAt);
          const dateLabel = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
          const len = a.answerMd.length;
          const isMostRecent = idx === 0;
          return (
            <li
              key={a.id}
              className={`rounded-md border transition-colors ${
                isMostRecent
                  ? "border-evergreen/40 bg-evergreen/5"
                  : "border-rule bg-card"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 rounded-md"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
                    #{attempts.length - idx}
                  </span>
                  <Clock className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
                  <span className="text-[12px] tabular-nums text-foreground/85">
                    {dateLabel}
                  </span>
                  {a.selfGrade && (
                    <GradeBadge grade={a.selfGrade} />
                  )}
                  <span className="text-[10.5px] text-muted-foreground tabular-nums ml-1">
                    {len}자
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
                )}
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-rule/60">
                  <div className="font-sans text-[12.5px] leading-[1.7] whitespace-pre-wrap text-foreground/85 max-h-[400px] overflow-y-auto">
                    {a.answerMd || (
                      <span className="text-muted-foreground italic">
                        (답안 없이 채점)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const GRADE_TONE: Record<string, { label: string; cls: string }> = {
  again: { label: "다시", cls: "bg-error/10 text-error" },
  hard: { label: "어려움", cls: "bg-warning/10 text-warning-text" },
  good: { label: "좋음", cls: "bg-evergreen/10 text-evergreen" },
  easy: { label: "쉬움", cls: "bg-info/10 text-info" },
};

function GradeBadge({ grade }: { grade: string }) {
  const tone = GRADE_TONE[grade];
  if (!tone) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tone.cls}`}>
      {tone.label}
    </span>
  );
}
