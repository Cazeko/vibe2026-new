"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpenCheck,
  FileText,
  GitCompare,
  KeyRound,
  Lock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/shared/markdown";
import type { CardHighlight } from "@/lib/db/queries";
import type {
  OverviewJson,
  KeywordsJson,
  DiffJson,
} from "@/lib/db/schema/user-card-ai-analysis";
import { HighlightLayer } from "./highlight-layer";
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

type TabKey = "overview" | "keywords" | "diff" | "reference" | "explanation";

type TabSpec = {
  key: TabKey;
  label: string;
  Icon: typeof Sparkles;
  unlocked: boolean;
};

const TABS: TabSpec[] = [
  { key: "overview", label: "AI 총평", Icon: Sparkles, unlocked: true },
  { key: "keywords", label: "키워드 비교", Icon: KeyRound, unlocked: false },
  { key: "diff", label: "답안 비교", Icon: GitCompare, unlocked: false },
  { key: "reference", label: "모범답안", Icon: BookOpenCheck, unlocked: true },
  { key: "explanation", label: "해설", Icon: FileText, unlocked: true },
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

type Props = {
  revealed: boolean;
  cardId: string;
  backMd: string | null;
  verifiedAnswer: boolean;
  highlights: CardHighlight[];
  blindMode: boolean;
  onToggleBlind: () => void;
  userAnswer: string;
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
            const locked = !revealed || !tab.unlocked;
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

      {/* 패널 본문 */}
      <CardContent className="p-5">
        {!revealed ? (
          <LockedPanel />
        ) : active === "overview" ? (
          <OverviewTab analysis={analysis} hasReference={!!backMd} />
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
        <button
          type="button"
          onClick={onToggleBlind}
          aria-pressed={blindMode}
          aria-label={
            blindMode
              ? "블라인드 모드 끄기"
              : "블라인드 모드 켜기 — 핵심 키워드 가리기"
          }
          className={`ml-auto inline-flex items-center gap-1 h-8 px-2 rounded border text-[11px] transition-colors ${
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
      </div>

      <div className="rounded-md border-l-4 border-evergreen border-y border-r border-rule bg-card p-4">
        <HighlightLayer
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
