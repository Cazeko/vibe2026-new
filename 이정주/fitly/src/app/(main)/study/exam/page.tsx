"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCcw, Sparkles, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStudySession } from "@/lib/hooks/use-study-session";

type Section = "vocab" | "grammar" | "reading";

type ExamItem = {
  id?: string;            // study_card 출처일 때만 존재
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  keywords: string[];
  source: "study_card" | "generated";
};

type StudyCardRow = {
  id: string;
  question: string;
  choices: string[] | null;
  answer: string | null;
  explanation: string | null;
  keywords: string[];
};

const SECTIONS: { key: Section; label: string }[] = [
  { key: "vocab", label: "어휘" },
  { key: "grammar", label: "문법" },
  { key: "reading", label: "독해" },
];

const GRADES: {
  key: "again" | "hard" | "good" | "easy";
  label: string;
  tone: string;
}[] = [
  {
    key: "again",
    label: "다시",
    tone: "bg-destructive/15 text-destructive hover:bg-destructive/25",
  },
  { key: "hard", label: "어려움", tone: "bg-secondary hover:bg-secondary/80" },
  {
    key: "good",
    label: "보통",
    tone: "bg-primary/15 text-primary hover:bg-primary/25",
  },
  {
    key: "easy",
    label: "쉬움",
    tone: "bg-accent/30 hover:bg-accent/50",
  },
];

// 헌법 v1.11 제13조의2 1항 — study_cards 우선 큐 + Gemini 폴백.
// 사용자가 자료를 업로드한 경우, 그 자료에서 추출된 학습 카드부터 풀게 한다.
// 큐가 비면 Gemini 일반 빈출 문제로 폴백 (제30조 4항 단서).
export default function ExamPage() {
  const [section, setSection] = useState<Section>("vocab");
  const [item, setItem] = useState<ExamItem | null>(null);
  const [studyQueue, setStudyQueue] = useState<StudyCardRow[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grading, setGrading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const session = useStudySession("exam");

  // 마운트 시 study_cards 큐 미리 로드
  useEffect(() => {
    fetch("/api/study-cards/next")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const items: StudyCardRow[] = (data.items ?? []).map(normalizeStudyCard);
        setStudyQueue(items);
      })
      .catch(() => {
        // 비-치명적: 폴백으로 Gemini 사용
      });
  }, []);

  useEffect(() => {
    if (picked && item) {
      session.recordCard(picked === item.answer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, item]);

  async function loadNext() {
    setLoading(true);
    setError(null);
    setItem(null);
    setPicked(null);
    setFeedback(null);

    try {
      // 1) study_cards 큐 우선
      const next = studyQueue[0];
      if (next && next.choices && next.choices.length >= 2 && next.answer) {
        setItem({
          id: next.id,
          question: next.question,
          choices: next.choices,
          answer: next.answer,
          explanation: next.explanation ?? "",
          keywords: next.keywords ?? [],
          source: "study_card",
        });
        setLoading(false);
        return;
      }

      // 2) Gemini 일반 빈출 폴백
      const res = await fetch("/api/exam/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "출제 실패");
      setItem({
        question: data.item.question,
        choices: data.item.choices,
        answer: data.item.answer,
        explanation: data.item.explanation ?? "",
        keywords: data.item.keywords ?? [],
        source: "generated",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setLoading(false);
    }
  }

  // study_card 풀이 결과를 SRS 에 반영하고 다음 카드로
  async function gradeStudyCard(grade: "again" | "hard" | "good" | "easy") {
    if (!item || item.source !== "study_card" || !item.id) return;
    setGrading(grade);
    setFeedback(null);
    try {
      const res = await fetch("/api/study-cards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: item.id, grade }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "리뷰 실패");
      setFeedback(
        data.promoted
          ? "오답 노트로 합류되었습니다 (제13조의2 1항)."
          : grade === "again" || grade === "hard"
            ? "이미 오답 노트에 등록된 카드입니다."
            : null,
      );
      // 큐에서 현재 카드 제거 후 다음 카드 로드
      const remaining = studyQueue.slice(1);
      setStudyQueue(remaining);
      setItem(null);
      setPicked(null);
      // 0.6 초 후 다음 카드 자동 로드
      setTimeout(() => {
        if (remaining.length > 0) {
          const next = remaining[0];
          if (next.choices && next.choices.length >= 2 && next.answer) {
            setItem({
              id: next.id,
              question: next.question,
              choices: next.choices,
              answer: next.answer,
              explanation: next.explanation ?? "",
              keywords: next.keywords ?? [],
              source: "study_card",
            });
          }
        }
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "리뷰 실패");
    } finally {
      setGrading(null);
    }
  }

  const isCorrect = picked && item ? picked === item.answer : null;
  const studyMode = item?.source === "study_card";
  const dueCount = studyQueue.length;

  return (
    <section className="mx-auto w-full max-w-md px-4 py-6 space-y-6 animate-fade-up">
      <header className="flex items-center justify-between">
        <Link
          href="/study"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> 학습
        </Link>
        {dueCount > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            내 자료 {dueCount}장 대기
          </span>
        )}
      </header>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">기출 풀이</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          업로드한 자료의 학습 카드를 우선 풀고, 큐가 비면 일반 빈출 문제로 전환됩니다.
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          헌법 제30조 4항 단서 — 일반 빈출 폴백은 학교 무관 데모. RAG 인덱싱 완료 시 자동 폐지.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          {dueCount === 0 && (
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
          )}
          <Button
            type="button"
            onClick={loadNext}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                준비 중…
              </>
            ) : dueCount > 0 ? (
              <>
                <BookOpen className="h-4 w-4" aria-hidden />내 자료에서 다음 문제 받기
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" aria-hidden />새 문제 받기 (일반 빈출)
              </>
            )}
          </Button>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {feedback && (
            <p role="status" className="text-[12px] text-evergreen">
              {feedback}
            </p>
          )}
        </CardContent>
      </Card>

      {item && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    studyMode
                      ? "bg-evergreen/10 text-evergreen"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {studyMode ? (
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" aria-hidden />내 자료
                    </span>
                  ) : (
                    "일반 빈출 (Gemini)"
                  )}
                </span>
                <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] text-warning">
                  AI 추정 — 검증 필요
                </span>
              </div>
              <p className="text-sm font-semibold leading-snug whitespace-pre-line pt-1">
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
                {item.explanation && (
                  <p className="text-muted-foreground">{item.explanation}</p>
                )}
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

            {/* study_card 모드일 때 SRS 등급 버튼 */}
            {picked && studyMode && (
              <div className="grid grid-cols-4 gap-2 pt-1">
                {GRADES.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => gradeStudyCard(g.key)}
                    disabled={!!grading}
                    className={`rounded-md px-2 py-2 text-[12px] font-medium transition-colors ${g.tone} ${
                      grading === g.key ? "opacity-50" : ""
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function normalizeStudyCard(r: Record<string, unknown>): StudyCardRow {
  return {
    id: String(r.id ?? ""),
    question: String(r.question ?? ""),
    choices: Array.isArray(r.choices) ? (r.choices as string[]) : null,
    answer: typeof r.answer === "string" ? r.answer : null,
    explanation: typeof r.explanation === "string" ? r.explanation : null,
    keywords: Array.isArray(r.keywords) ? (r.keywords as string[]) : [],
  };
}
