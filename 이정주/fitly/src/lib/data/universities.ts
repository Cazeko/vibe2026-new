import type { UniversityName } from "@/types";
import type { Cutoffs, Weights } from "@/lib/fit/score";

export type UniversitySeed = {
  name: UniversityName;
  weights: Weights;
  cutoffs: Cutoffs;
  source: "demo";
};

/**
 * 임시 데모용 시드. 헌법 제11조에 따라 실제 합격 컷·평균·가중치는
 * 공시 + 합격 수기 + 인터뷰 3종 교차 검증 후 RAG로 대체된다.
 * 이 값들은 발표·서비스 노출 시 "데모"로 표시되어야 한다 (제29조).
 */
export const UNIVERSITY_SEEDS: UniversitySeed[] = [
  { name: "한양",   weights: { vocab: 40, grammar: 30, reading: 30 }, cutoffs: { vocab_cut: 60, vocab_avg: 80, grammar_cut: 55, grammar_avg: 75, reading_cut: 60, reading_avg: 80 }, source: "demo" },
  { name: "중앙",   weights: { vocab: 35, grammar: 30, reading: 35 }, cutoffs: { vocab_cut: 55, vocab_avg: 75, grammar_cut: 55, grammar_avg: 75, reading_cut: 60, reading_avg: 78 }, source: "demo" },
  { name: "성균관", weights: { vocab: 30, grammar: 35, reading: 35 }, cutoffs: { vocab_cut: 60, vocab_avg: 80, grammar_cut: 60, grammar_avg: 78, reading_cut: 60, reading_avg: 80 }, source: "demo" },
  { name: "경희",   weights: { vocab: 35, grammar: 30, reading: 35 }, cutoffs: { vocab_cut: 55, vocab_avg: 72, grammar_cut: 50, grammar_avg: 70, reading_cut: 55, reading_avg: 75 }, source: "demo" },
  { name: "이화",   weights: { vocab: 30, grammar: 30, reading: 40 }, cutoffs: { vocab_cut: 55, vocab_avg: 75, grammar_cut: 55, grammar_avg: 73, reading_cut: 60, reading_avg: 80 }, source: "demo" },
  { name: "서강",   weights: { vocab: 30, grammar: 30, reading: 40 }, cutoffs: { vocab_cut: 60, vocab_avg: 78, grammar_cut: 55, grammar_avg: 75, reading_cut: 60, reading_avg: 82 }, source: "demo" },
  { name: "홍익",   weights: { vocab: 40, grammar: 30, reading: 30 }, cutoffs: { vocab_cut: 50, vocab_avg: 70, grammar_cut: 50, grammar_avg: 68, reading_cut: 50, reading_avg: 70 }, source: "demo" },
  { name: "동국",   weights: { vocab: 35, grammar: 30, reading: 35 }, cutoffs: { vocab_cut: 50, vocab_avg: 70, grammar_cut: 50, grammar_avg: 68, reading_cut: 55, reading_avg: 72 }, source: "demo" },
  { name: "건국",   weights: { vocab: 35, grammar: 30, reading: 35 }, cutoffs: { vocab_cut: 50, vocab_avg: 70, grammar_cut: 50, grammar_avg: 68, reading_cut: 55, reading_avg: 72 }, source: "demo" },
  { name: "숭실",   weights: { vocab: 40, grammar: 30, reading: 30 }, cutoffs: { vocab_cut: 45, vocab_avg: 65, grammar_cut: 45, grammar_avg: 65, reading_cut: 50, reading_avg: 68 }, source: "demo" },
];

export function getUniversitySeed(
  name: UniversityName | null
): UniversitySeed | null {
  if (!name) return null;
  return UNIVERSITY_SEEDS.find((u) => u.name === name) ?? null;
}
