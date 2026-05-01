"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AnswerSource } from "@/types";

type MistakeRow = {
  id: string;
  question: string;
  choices: string[] | null;
  answer: string | null;
  explanation: string | null;
  keywords: string[];
  answerSource: AnswerSource;
  reviewCount: number;
  lapseCount: number;
};

type Status = "loading" | "empty" | "ready" | "reviewing" | "done" | "error";

const GRADES: { key: "again" | "hard" | "good" | "easy"; label: string; tone: string }[] = [
  { key: "again", label: "다시", tone: "bg-destructive/15 text-destructive hover:bg-destructive/25" },
  { key: "hard",  label: "어려움", tone: "bg-secondary hover:bg-secondary/80" },
  { key: "good",  label: "보통", tone: "bg-primary/15 text-primary hover:bg-primary/25" },
  { key: "easy",  label: "쉬움", tone: "bg-accent/30 hover:bg-accent/50" },
];

const ANSWER_BADGE: Record<AnswerSource, { label: string; className: string }> = {
  official: { label: "공식", className: "bg-secondary text-foreground/80" },
  ai_estimate: {
    label: "검증 필요",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  },
  crowd_verified: { label: "검증됨", className: "bg-primary/10 text-primary" },
};

export default function ReviewPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [queue, setQueue] = useState<MistakeRow[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/mistakes/next");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "조회 실패");
      const items: MistakeRow[] = (data.items ?? []).map(normalize);
      if (items.length === 0) {
        setStatus("empty");
      } else {
        setQueue(items);
        setIndex(0);
        setRevealed(false);
        setStatus("ready");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleGrade(grade: "again" | "hard" | "good" | "easy") {
    const card = queue[index];
    if (!card) return;
    setStatus("reviewing");
    try {
      const res = await fetch("/api/mistakes/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, grade }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "리뷰 실패");

      if (index + 1 >= queue.length) {
        setStatus("done");
      } else {
        setIndex(index + 1);
        setRevealed(false);
        setStatus("ready");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
      setStatus("error");
    }
  }

  const current = queue[index];
  const progress =
    queue.length > 0 ? ((index + (revealed ? 0.5 : 0)) / queue.length) * 100 : 0;

  return (
    <section className="mx-auto w-full max-w-md px-4 py-6 space-y-6 animate-fade-up">
      <header className="flex items-center justify-between">
        <Link
          href="/study"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> 학습
        </Link>
        <p className="text-xs text-muted-foreground">
          {status === "ready" || status === "reviewing"
            ? `${index + 1} / ${queue.length}`
            : ""}
        </p>
      </header>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">시카드 복습</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          내가 올린 시험지에서 추출한 오답을 SRS로 복습합니다.
        </p>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        aria-hidden
      >
        <div
          className="h-full gauge-gradient transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {status === "loading" && (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            카드를 불러오는 중…
          </CardContent>
        </Card>
      )}

      {status === "empty" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Sparkles className="h-8 w-8 text-primary" aria-hidden />
            <p className="font-semibold">오늘 복습할 시카드가 없습니다.</p>
            <p className="text-sm text-muted-foreground">
              내 오답 탭에서 시험지를 업로드하면 자동으로 큐에 추가됩니다.
            </p>
            <Link href="/mistakes">
              <Button>오답 업로드로</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {status === "done" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full gauge-gradient text-2xl text-white">
              ✓
            </div>
            <p className="font-semibold">오늘의 복습 완료</p>
            <p className="text-sm text-muted-foreground">
              FSRS가 자동으로 다음 일정을 잡아두었습니다.
            </p>
            <Button variant="outline" onClick={load}>
              다시 불러오기
            </Button>
          </CardContent>
        </Card>
      )}

      {(status === "ready" || status === "reviewing") && current && (
        <Card>
          <CardContent className="flex flex-col gap-4 py-6">
            <p className="text-sm font-semibold leading-snug">
              {current.question}
            </p>

            {current.choices && current.choices.length > 0 && (
              <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                {current.choices.map((c, j) => (
                  <li key={j}>{c}</li>
                ))}
              </ol>
            )}

            {!revealed ? (
              <Button
                variant="outline"
                onClick={() => setRevealed(true)}
                disabled={status === "reviewing"}
              >
                정답·해설 보기
              </Button>
            ) : (
              <div className="space-y-2 rounded-lg bg-secondary/50 p-3">
                {current.answer ? (
                  <p className="flex items-center gap-2 text-sm">
                    <span className="font-medium">정답:</span>
                    <span>{current.answer}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${ANSWER_BADGE[current.answerSource].className}`}
                    >
                      {ANSWER_BADGE[current.answerSource].label}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    이 카드는 정답이 비어 있습니다.
                  </p>
                )}
                {current.explanation && (
                  <p className="text-sm text-muted-foreground">
                    {current.explanation}
                  </p>
                )}
                {current.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {current.keywords.map((k) => (
                      <span
                        key={k}
                        className="rounded bg-background px-2 py-0.5 text-xs"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {revealed && (
              <div className="grid w-full grid-cols-2 gap-2 pt-1">
                {GRADES.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => handleGrade(g.key)}
                    disabled={status === "reviewing"}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${g.tone}`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}

function normalize(r: Record<string, unknown>): MistakeRow {
  return {
    id: String(r.id ?? ""),
    question: String(r.question ?? ""),
    choices: Array.isArray(r.choices) ? (r.choices as string[]) : null,
    answer: typeof r.answer === "string" ? r.answer : null,
    explanation: typeof r.explanation === "string" ? r.explanation : null,
    keywords: Array.isArray(r.keywords) ? (r.keywords as string[]) : [],
    answerSource:
      (typeof r.answerSource === "string"
        ? (r.answerSource as AnswerSource)
        : "ai_estimate") ?? "ai_estimate",
    reviewCount: Number(r.reviewCount ?? 0),
    lapseCount: Number(r.lapseCount ?? 0),
  };
}
