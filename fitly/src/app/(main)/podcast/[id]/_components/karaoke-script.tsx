"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/shared/markdown";
import { usePodcastPlayer } from "@/components/shared/podcast-player-provider";
import type { PodcastScript } from "@/lib/podcast/script";

// v3.7 외부 평가 #5.4 — 카라오케 스크립트 sync.
// PodcastScript 는 line 별 timestamp 를 갖지 않으므로(script.ts 정합) duration 을
// 라인별로 분배하여 현재 재생 시점이 어느 line 인지 추정한다.
//
// 2026-05-16 (주인님 보고) — 종전 *균등 분할* (per = total / dialogue.length) 은
// 짧은 한 줄과 긴 한 줄에 동일 시간을 부여해 후반부로 갈수록 누적 오차가 커지는
// 회귀가 있었음. 한국어 TTS 는 음절 단위 발화이므로 *라인 텍스트 글자 수에
// 비례한 시간 분배* 가 훨씬 정확. markdown 기호(`*` `_` `\`` etc.) 는 발화에
// 기여하지 않으므로 제거 후 글자 수를 센다.

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

  // line 별 시작 시간 (초). 라인 텍스트 글자 수에 비례한 가중 분배.
  const lineStarts = useMemo(() => {
    const total = dur > 0 ? dur : (script.estimatedDurationSec ?? 60);
    const stripMd = (s: string) =>
      s.replace(/[*_`~\[\]()<>]/g, "").replace(/\s+/g, " ").trim();
    const weights = script.dialogue.map((l) => stripMd(l.text).length || 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight === 0) {
      const per = total / script.dialogue.length;
      return script.dialogue.map((_, idx) => idx * per);
    }
    const starts: number[] = [];
    let acc = 0;
    for (let i = 0; i < script.dialogue.length; i += 1) {
      starts.push(acc);
      acc += (weights[i] / totalWeight) * total;
    }
    return starts;
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
