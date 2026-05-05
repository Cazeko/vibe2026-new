import type { AnswerSource, MistakeCard } from "@/types";

export type SavedMistake = MistakeCard & {
  id: string;
  createdAt: string;
  answerSource: AnswerSource;
};

const VALID_SOURCES: ReadonlySet<AnswerSource> = new Set([
  "official",
  "ai_estimate",
  "crowd_verified",
]);

function toAnswerSource(v: unknown): AnswerSource {
  return typeof v === "string" && VALID_SOURCES.has(v as AnswerSource)
    ? (v as AnswerSource)
    : "ai_estimate";
}

export function normalizeSavedMistakes(
  rows: Array<Record<string, unknown>>
): SavedMistake[] {
  return rows.map((r) => ({
    id: String(r.id ?? ""),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    question: String(r.question ?? ""),
    choices: Array.isArray(r.choices) ? (r.choices as string[]) : undefined,
    answer: typeof r.answer === "string" ? r.answer : undefined,
    explanation:
      typeof r.explanation === "string" ? r.explanation : undefined,
    keywords: Array.isArray(r.keywords) ? (r.keywords as string[]) : [],
    answerSource: toAnswerSource(r.answerSource ?? r.answer_source),
  }));
}
