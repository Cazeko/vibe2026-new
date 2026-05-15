"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Sparkles } from "lucide-react";
import type { CardType } from "@/types";
import { StudyTimer } from "./study-timer";

// 헌법 v3.5.3 §16 + 2026-05-14 brainstorming PR 1 — 학습 워크스페이스 골격.
// 카드 메타·세션 진행률·학습 상태(채점 전/후) 를 가로 한 줄로 압축 표기한다.
// docs/plans/2026-05-14-essay-workspace-design.md §4 정합.
//
// 백승환 #4 (2026-05-15) — 진행률 표기 재설계.
// 종전: "세션 0장" + (sessionCount * 8)% 가짜 progress bar → 작동 안 함 인상.
// 개선: "현재 N번째 / 총 M장" + (현재/총)% 실제 진행률.
// 총 M = 세션 시작 시점의 dueCount 를 ref 로 fix (router.refresh 로 재로드되어도 보존).
// 현재 N = sessionCount + 1 (지금 풀고 있는 카드는 N번째).
//
// 백승환 #7 (2026-05-15) — 카드 메타 우측에 타이머 통합. cardId 기반 자동 리셋.

type Props = {
  track: CardType;
  paperLabel: string | null;
  itemFormat: string | null;
  itemPoints: number | null;
  sessionCount: number;
  remainingCount: number;
  revealed: boolean;
  cardId: string;
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
  remainingCount,
  revealed,
  cardId,
}: Props) {
  const initialTotalRef = useRef<number | null>(null);
  const [initialTotal, setInitialTotal] = useState<number>(0);
  // 첫 마운트 시 dueCount 스냅샷 — 카드를 풀어 dueCount 가 줄어도 분모 보존.
  // remainingCount 는 현재 카드를 포함한 남은 수. sessionCount 누적과 합쳐 총량 추정.
  useEffect(() => {
    if (initialTotalRef.current == null) {
      const snap = sessionCount + remainingCount;
      initialTotalRef.current = snap;
      setInitialTotal(snap);
    }
  }, [sessionCount, remainingCount]);

  const total = initialTotal > 0 ? initialTotal : Math.max(sessionCount + remainingCount, 1);
  const current = Math.min(sessionCount + 1, total);
  const progressPct = Math.min(100, Math.round((sessionCount / total) * 100));
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

        {/* 백승환 #7 — 타이머 chip. 우측 진행률 좌측에 배치. */}
        <div className="ml-auto">
          <StudyTimer cardId={cardId} />
        </div>

        {/* 세션 진행률 — 우측 정렬. "N / M" + 굵은 progress bar. */}
        <div
          className="flex items-center gap-2.5 text-[11.5px] text-muted-foreground"
          aria-live="polite"
        >
          <span className="uppercase tracking-[0.12em] text-[10.5px]">
            진행
          </span>
          <span className="tabular-nums font-semibold text-foreground">
            <span className="text-evergreen">{current}</span>
            <span className="mx-0.5 text-muted-foreground/70">/</span>
            <span>{total}</span>
            <span className="ml-0.5 text-[10.5px] text-muted-foreground font-normal">
              장
            </span>
          </span>
          <div
            className="h-1.5 w-32 overflow-hidden rounded-full bg-rule"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`세션 진행률 — ${current} / ${total}장 (${progressPct}%)`}
          >
            <div
              className="h-full bg-evergreen transition-all duration-500"
              style={{ width: `${progressPct}%` }}
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

