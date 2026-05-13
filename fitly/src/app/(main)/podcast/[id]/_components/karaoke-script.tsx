"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/shared/markdown";
import { usePodcastPlayer } from "@/components/shared/podcast-player-provider";
import type { PodcastScript } from "@/lib/podcast/script";

// v3.7 외부 평가 #5.4 — 카라오케 스크립트 sync.
// PodcastScript 는 line 별 timestamp 를 갖지 않으므로(script.ts 정합) duration 을
// dialogue 개수로 균등 분할하여 현재 재생 시점이 어느 line 인지 추정한다.
// 정확도는 ±몇 초 수준이나, 학습 청취 보조 도구로서 충분히 직관적.

type Props = {
  episodeId: string;
  script: PodcastScript;
};

export function KaraokeScript({ episodeId, script }: Props) {
  const {
    episode,
    currentSec,
    durationSec,
  } = usePodcastPlayer();

  const isActive = episode?.id === episodeId;
  const dur = isActive ? durationSec : script.estimatedDurationSec ?? 0;
  const cur = isActive ? currentSec : 0;

  // line 별 시작 시간 (초). 균등 분할.
  const lineStarts = useMemo(() => {
    const total = dur > 0 ? dur : (script.estimatedDurationSec ?? 60);
    const per = total / script.dialogue.length;
    return script.dialogue.map((_, idx) => idx * per);
  }, [dur, script]);

  // 현재 line 인덱스 — cur 이 어느 lineStart 구간에 속하는지.
  const activeIdx = useMemo(() => {
    if (!isActive || cur <= 0) return -1;
    for (let i = lineStarts.length - 1; i >= 0; i -= 1) {
      if (cur >= lineStarts[i]) return i;
    }
    return -1;
  }, [isActive, cur, lineStarts]);

  return (
    <Card className="border-rule">
      <CardContent className="p-5 space-y-2">
        {script.dialogue.map((line, idx) => {
          const isCurrent = idx === activeIdx;
          const isPast = idx < activeIdx;
          return (
            <div
              key={idx}
              className={`flex gap-3 min-w-0 rounded-md px-2 py-2 -mx-2 transition-colors duration-300 ${
                isCurrent
                  ? "bg-gold-soft/40 dark:bg-gold-soft/30"
                  : isPast
                    ? "opacity-60"
                    : ""
              }`}
              aria-current={isCurrent ? "true" : undefined}
            >
              <span
                className={`shrink-0 min-w-10 max-w-[80px] truncate text-[11px] font-medium tabular-nums ${
                  line.speaker === script.speakers[0]
                    ? "text-foreground"
                    : "text-muted-foreground"
                } ${isCurrent ? "font-bold" : ""}`}
                title={line.speaker}
              >
                {line.speaker}
              </span>
              <div className="flex-1 min-w-0">
                <Markdown
                  className={`text-[13px] leading-[1.7] ${
                    isCurrent ? "text-foreground" : "text-foreground/85"
                  }`}
                >
                  {line.text}
                </Markdown>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
