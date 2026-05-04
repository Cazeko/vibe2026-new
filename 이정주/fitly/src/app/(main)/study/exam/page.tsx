"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Section = "vocab" | "grammar" | "reading";

type ExamItem = {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  keywords: string[];
};

const SECTIONS: { key: Section; label: string }[] = [
  { key: "vocab", label: "어휘" },
  { key: "grammar", label: "문법" },
  { key: "reading", label: "독해" },
];

// 헌법 v1.8 제30조 4항 — RAG 시드 미완성 시점 출제는 학교 무관 일반 빈출 한정.
export default function ExamPage() {
  const [section, setSection] = useState<Section>("vocab");
  const [item, setItem] = useState<ExamItem | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setItem(null);
    setPicked(null);
    try {
      const res = await fetch("/api/exam/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "출제 실패");
      setItem(data.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setLoading(false);
    }
  }

  const isCorrect = picked && item ? picked === item.answer : null;

  return (
    <section className="mx-auto w-full max-w-md px-4 py-6 space-y-6 animate-fade-up">
      <header className="flex items-center justify-between">
        <Link
          href="/study"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> 학습
        </Link>
      </header>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">기출 풀이</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          영역을 선택하면 일반 빈출 난이도 문제가 즉시 생성됩니다.
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          현재 데모는 학교 무관 일반 빈출 문제만 출제합니다 (헌법 v1.8 제30조 4항 — 학교별 RAG 인덱싱 진행 중).
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="grid grid-cols-3 gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSection(s.key)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  section === s.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            onClick={generate}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                출제 중…
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" aria-hidden />
                새 문제 받기
              </>
            )}
          </Button>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {item && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-1">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                AI 추정 — 검증 필요
              </span>
              <p className="text-sm font-semibold leading-snug whitespace-pre-line">
                {item.question}
              </p>
            </div>
            <ul className="space-y-2">
              {item.choices.map((c) => {
                const chosen = picked === c;
                const correctAfter = picked && c === item.answer;
                const wrongAfter = chosen && c !== item.answer;
                return (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => !picked && setPicked(c)}
                      disabled={!!picked}
                      className={`w-full text-left rounded-md border px-3 py-2 text-sm transition-colors ${
                        correctAfter
                          ? "border-primary bg-primary/10 font-semibold"
                          : wrongAfter
                          ? "border-destructive bg-destructive/10"
                          : chosen
                          ? "border-primary"
                          : "border-input hover:bg-secondary/60"
                      }`}
                    >
                      {c}
                    </button>
                  </li>
                );
              })}
            </ul>
            {picked && (
              <div className="space-y-2 rounded-lg bg-secondary/50 p-3 text-sm">
                <p
                  className={`font-semibold ${
                    isCorrect ? "text-primary" : "text-destructive"
                  }`}
                >
                  {isCorrect ? "정답입니다." : "틀렸습니다."}
                </p>
                <p className="text-muted-foreground">{item.explanation}</p>
                {item.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.keywords.map((k) => (
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
          </CardContent>
        </Card>
      )}
    </section>
  );
}
