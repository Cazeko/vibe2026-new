"use client";

import { useState } from "react";
import { Pencil, Loader2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MistakeCard, AnswerSource } from "@/types";

type Item = MistakeCard & {
  id?: string;
  createdAt?: string;
  answerSource?: AnswerSource;
};

type MistakeCardListProps = {
  items: Item[];
  onUpdated?: (id: string, updated: Partial<Item>) => void;
};

const ANSWER_BADGE: Record<
  AnswerSource,
  { label: string; className: string }
> = {
  official: {
    label: "공식",
    className: "bg-secondary text-foreground/80",
  },
  ai_estimate: {
    label: "검증 필요",
    className:
      "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  },
  crowd_verified: {
    label: "검증됨",
    className: "bg-primary/10 text-primary",
  },
};

export function MistakeCardList({ items, onUpdated }: MistakeCardListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        저장된 오답 카드가 없습니다. 시험지를 업로드해 주세요.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((s, i) => (
        <li key={s.id ?? i}>
          <CardItem item={s} index={i} onUpdated={onUpdated} />
        </li>
      ))}
    </ul>
  );
}

function CardItem({
  item,
  index,
  onUpdated,
}: {
  item: Item;
  index: number;
  onUpdated?: (id: string, updated: Partial<Item>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [answer, setAnswer] = useState(item.answer ?? "");
  const [explanation, setExplanation] = useState(item.explanation ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const src: AnswerSource = item.answerSource ?? "ai_estimate";
  const badge = ANSWER_BADGE[src];

  async function save() {
    if (!item.id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/mistakes/${item.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer,
          explanation: explanation || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      onUpdated?.(item.id, {
        answer,
        explanation,
        answerSource: "crowd_verified",
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm leading-snug">
          Q{index + 1}. {item.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {item.choices && item.choices.length > 0 && (
          <ol className="list-decimal pl-5 space-y-0.5 text-muted-foreground">
            {item.choices.map((c, j) => (
              <li key={j}>{c}</li>
            ))}
          </ol>
        )}

        {!editing ? (
          <>
            {item.answer ? (
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-medium">정답:</span>
                <span>{item.answer}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${badge.className}`}
                >
                  {badge.label}
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground">정답이 비어 있습니다.</p>
            )}
            {item.explanation && (
              <p className="text-muted-foreground">{item.explanation}</p>
            )}
            {item.id && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                className="-ml-2 h-8 px-2 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                정답 신고·수정
              </Button>
            )}
          </>
        ) : (
          <div className="space-y-2 rounded-lg bg-secondary/40 p-3">
            <div className="space-y-1">
              <Label htmlFor={`ans-${item.id}`} className="text-xs">
                정답
              </Label>
              <Input
                id={`ans-${item.id}`}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="정답 텍스트 또는 번호"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`exp-${item.id}`} className="text-xs">
                해설(선택)
              </Label>
              <Input
                id={`exp-${item.id}`}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="간단한 해설"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={save}
                disabled={saving || answer.trim().length === 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    저장 중…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" aria-hidden />
                    검증으로 저장
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setError(null);
                }}
              >
                <X className="h-4 w-4" aria-hidden />
                취소
              </Button>
            </div>
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              저장 시 본 카드는 &ldquo;검증됨&rdquo;으로 승격됩니다 (헌법 제30조의2).
            </p>
          </div>
        )}

        {item.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {item.keywords.map((k) => (
              <span
                key={k}
                className="rounded bg-secondary px-2 py-0.5 text-xs"
              >
                {k}
              </span>
            ))}
          </div>
        )}
        <span className="inline-block rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px]">
          내가 올린 시험지
        </span>
      </CardContent>
    </Card>
  );
}
