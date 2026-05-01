import { clamp } from "@/lib/utils";

export type SectionKey = "vocab" | "grammar" | "reading";

export type Cutoffs = {
  vocab_cut: number;
  vocab_avg: number;
  grammar_cut: number;
  grammar_avg: number;
  reading_cut: number;
  reading_avg: number;
};

export type Weights = {
  vocab: number;
  grammar: number;
  reading: number;
};

export type UserSectionScores = {
  vocab: number;
  grammar: number;
  reading: number;
};

/**
 * Position % within a section.
 * 0%   = at the school's pass cutoff
 * 100% = at the school's pass average
 *
 * Allowed to overshoot above 100 (safe zone).
 * Floored at 0 visually but raw value is clamped at -50 for trend graphs.
 */
export function sectionPosition(
  score: number,
  cut: number,
  avg: number
): number {
  if (avg <= cut) return score >= cut ? 100 : 0;
  const pct = ((score - cut) / (avg - cut)) * 100;
  return Math.round(clamp(pct, -50, 150));
}

/**
 * Composite Fit score for a target school.
 * Returns 0~150 (clamped). UI typically caps display at 100.
 */
export function computeFit(
  scores: UserSectionScores,
  cutoffs: Cutoffs,
  weights: Weights
): {
  total: number;
  vocab: number;
  grammar: number;
  reading: number;
} {
  const vocab = sectionPosition(scores.vocab, cutoffs.vocab_cut, cutoffs.vocab_avg);
  const grammar = sectionPosition(scores.grammar, cutoffs.grammar_cut, cutoffs.grammar_avg);
  const reading = sectionPosition(scores.reading, cutoffs.reading_cut, cutoffs.reading_avg);

  const wSum = weights.vocab + weights.grammar + weights.reading || 100;
  const total =
    (vocab * weights.vocab + grammar * weights.grammar + reading * weights.reading) /
    wSum;

  return {
    total: Math.round(clamp(total, 0, 150)),
    vocab,
    grammar,
    reading,
  };
}
