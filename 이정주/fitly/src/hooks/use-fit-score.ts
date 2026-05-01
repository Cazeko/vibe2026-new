"use client";

import { useMemo } from "react";
import { computeFit } from "@/lib/fit/score";
import type { UserSectionScores, Weights, Cutoffs } from "@/lib/fit/score";

export function useFitScore(
  scores: UserSectionScores | null,
  cutoffs: Cutoffs | null,
  weights: Weights | null
) {
  return useMemo(() => {
    if (!scores || !cutoffs || !weights) return null;
    return computeFit(scores, cutoffs, weights);
  }, [scores, cutoffs, weights]);
}
