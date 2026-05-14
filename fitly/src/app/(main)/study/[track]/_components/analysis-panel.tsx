"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/shared/markdown";
import type { CardHighlight } from "@/lib/db/queries";
import { HighlightLayer } from "./highlight-layer";

// 헌법 v3.5.3 §16 + 2026-05-14 brainstorming PR 1 — 워크스페이스 분석 패널 골격.
// 본 패널은 풀이 트랙(quiz/mistake) SplitView 우측에 위치하는 탭 컨테이너이다.
// docs/plans/2026-05-14-essay-workspace-design.md §4 정합.
//
// 5탭 구성
// - overview     : AI 총평 (PR 3 에서 활성화) — 현재 "준비 중" placeholder
// - keywords     : 키워드 비교 (PR 4 에서 활성화) — 현재 "준비 중" placeholder
// - diff         : 답안 diff (PR 5 에서 활성화) — 현재 "준비 중" placeholder
// - reference    : 모범답안 — PR 1 에서 즉시 활성 (기존 backMd 마크다운 + 형광펜 + 블라인드)
// - explanation  : 해설 — PR 1 placeholder (시드 분리 필요 시 후속)
//
// 잠금 정책
// - 채점 전(revealed === false) — 모든 탭 잠금, 자물쇠 + "채점 후 활성화" 안내
// - 채점 후 — reference 가 기본 활성. PR 2~5 미구현 탭은 "준비 중" placeholder.

type TabKey = "overview" | "keywords" | "diff" | "reference" | "explanation";

type TabSpec = {
  key: TabKey;
  label: string;
  Icon: typeof Sparkles;
  unlockedInPR1: boolean;
};

const TABS: TabSpec[] = [
  { key: "overview", label: "AI 총평", Icon: Sparkles, unlockedInPR1: false },
  { key: "keywords", label: "키워드 비교", Icon: KeyRound, unlockedInPR1: false },
  { key: "diff", label: "답안 비교", Icon: GitCompare, unlockedInPR1: false },
  {
    key: "reference",
    label: "모범답안",
    Icon: BookOpenCheck,
    unlockedInPR1: true,
  },
  {
    key: "explanation",
    label: "해설",
    Icon: FileText,
    unlockedInPR1: true,
  },
];

type Props = {
  revealed: boolean;
  cardId: string;
  backMd: string | null;
  verifiedAnswer: boolean;
  highlights: CardHighlight[];
  blindMode: boolean;
  onToggleBlind: () => void;
};

export function AnalysisPanel({
  revealed,
  cardId,
  backMd,
  verifiedAnswer,
  highlights,
  blindMode,
  onToggleBlind,
}: Props) {
  const [active, setActive] = useState<TabKey>("reference");

  // 채점 직후 — 활성 탭이 잠긴 상태이면 reference 로 강제 이동.
  useEffect(() => {
    if (!revealed) return;
    const spec = TABS.find((t) => t.key === active);
    if (!spec?.unlockedInPR1) setActive("reference");
  }, [revealed, active]);

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
            const locked = !revealed || !tab.unlockedInPR1;
            const lockReason = !revealed
              ? "채점 후 활성화"
              : !tab.unlockedInPR1
                ? "준비 중"
                : "";
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`analysis-panel-${tab.key}`}
                disabled={locked && !revealed}
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
      {/* 헤더 — 검증 배지 + 블라인드 토글 */}
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

      {/* 본문 — 형광펜 보존 (back_md surface) */}
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
  // 잠긴 상태에서는 클릭 자체가 안 되므로 본 fallback 은 보호적 코드.
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
