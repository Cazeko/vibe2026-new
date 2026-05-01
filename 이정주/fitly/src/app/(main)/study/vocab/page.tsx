"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type VocabCardRow = {
  id: string;
  term: string;
  definition: string;
  example: string | null;
  level: string | null;
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

export default function VocabStudyPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [queue, setQueue] = useState<VocabCardRow[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  async function load() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/vocab/next");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "조회 실패");
      const items: VocabCardRow[] = data.items ?? [];
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

  async function handleSeed() {
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch("/api/vocab/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "시드 실패");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
      setStatus("error");
    } finally {
      setSeeding(false);
    }
  }

  async function handleGrade(grade: "again" | "hard" | "good" | "easy") {
    const card = queue[index];
    if (!card) return;
    setStatus("reviewing");
    try {
      const res = await fetch("/api/vocab/review", {
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
  const progress = queue.length > 0 ? ((index + (revealed ? 0.5 : 0)) / queue.length) * 100 : 0;

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
        <h1 className="text-2xl font-bold tracking-tight">영단어 SRS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          FSRS 알고리즘으로 망각 직전에 복습합니다.
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
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 카드를 불러오는 중…
          </CardContent>
        </Card>
      )}

      {status === "empty" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Sparkles className="h-8 w-8 text-primary" aria-hidden />
            <p className="font-semibold">오늘 복습할 카드가 없습니다.</p>
            <p className="text-sm text-muted-foreground">
              아래 버튼으로 편입 빈출 어휘 40개를 받아 시작해 보세요.
            </p>
            <Button onClick={handleSeed} disabled={seeding}>
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  생성 중…
                </>
              ) : (
                "데모 시드 받기"
              )}
            </Button>
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
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            {current.level && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                {current.level}
              </span>
            )}
            <p className="text-3xl font-extrabold tracking-tight">
              {current.term}
            </p>
            {revealed ? (
              <div className="space-y-2">
                <p className="text-base font-semibold">{current.definition}</p>
                {current.example && (
                  <p className="text-sm text-muted-foreground italic">
                    “{current.example}”
                  </p>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setRevealed(true)}
                disabled={status === "reviewing"}
              >
                뜻 보기
              </Button>
            )}
            {revealed && (
              <div className="grid w-full grid-cols-2 gap-2 pt-2">
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
