"use client";

import { Pencil, Sparkles } from "lucide-react";
import type { CardType } from "@/types";

// 헌법 v3.5.3 §16 + 2026-05-14 brainstorming PR 1 — 학습 워크스페이스 골격.
// 카드 메타·세션 진행률·학습 상태(채점 전/후) 를 가로 한 줄로 압축 표기한다.
// docs/plans/2026-05-14-essay-workspace-design.md §4 정합.

type Props = {
  track: CardType;
  paperLabel: string | null;
  itemFormat: string | null;
  itemPoints: number | null;
  sessionCount: number;
  revealed: boolean;
};

const TRACK_LABEL: Record<CardType, string> = {
  quiz: "풀이",
  keyword: "키워드",
  mistake: "오답",
};

export function WorkspaceTopbar({
  track,
  paperLabel,
  itemFormat,
  itemPoints,
  sessionCount,
  revealed,
}: Props) {
  const sessionProgressPct = Math.min(100, sessionCount * 8);
  const phase = revealed ? "review" : "writing";

  return (
    <div className="rounded-md border border-rule bg-card/60 px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* 학습 상태 — 채점 전(작성) / 채점 후(피드백 검토) */}
        <PhaseBadge phase={phase} />

        {/* 카드 라벨 */}
        <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
          <span className="uppercase tracking-[0.12em] text-[10.5px]">
            {TRACK_LABEL[track]}
          </span>
          <span className="text-rule-strong" aria-hidden>
            ·
          </span>
          <span className="text-foreground/85">{paperLabel ?? "출처 미상"}</span>
          {itemFormat && (
            <span className="rounded-full border border-rule px-1.5 py-px text-[10.5px]">
              {itemFormat}
            </span>
          )}
          {itemPoints != null && (
            <span className="rounded-full border border-rule px-1.5 py-px text-[10.5px] tabular-nums">
              {itemPoints}점
            </span>
          )}
        </div>

        {/* 세션 진행률 — 우측 정렬 */}
        <div
          className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground"
          aria-live="polite"
        >
          <span className="uppercase tracking-[0.12em] text-[10.5px]">
            세션
          </span>
          <span className="tabular-nums font-medium text-foreground">
            {sessionCount}장
          </span>
          <div
            className="h-1 w-24 overflow-hidden rounded-full bg-rule"
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
      </div>
    </div>
  );
}

function PhaseBadge({ phase }: { phase: "writing" | "review" }) {
  if (phase === "writing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-2.5 py-1 text-[11px] text-foreground/85">
        <Pencil className="h-3 w-3" aria-hidden />
        답안 작성 중
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-evergreen/10 px-2.5 py-1 text-[11px] text-evergreen">
      <Sparkles className="h-3 w-3" aria-hidden />
      피드백 검토 중
    </span>
  );
}

