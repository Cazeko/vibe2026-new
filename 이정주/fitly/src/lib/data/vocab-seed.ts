/**
 * 편입 빈출 어휘 데모 시드 (40개).
 * 헌법 제11조 — 이 시드는 데모용이며 실 데이터는 추후 RAG 기반으로 확장된다.
 */

export type VocabSeed = {
  term: string;
  definition: string;
  example?: string;
  level?: "기초" | "중급" | "고급";
};

export const VOCAB_SEED: VocabSeed[] = [
  { term: "ambiguous", definition: "모호한, 애매한", example: "an ambiguous answer", level: "중급" },
  { term: "alleviate", definition: "완화하다, 경감시키다", example: "alleviate pain", level: "중급" },
  { term: "abundant", definition: "풍부한", example: "abundant resources", level: "기초" },
  { term: "advocate", definition: "옹호하다 / 옹호자", example: "advocate for change", level: "중급" },
  { term: "affluent", definition: "부유한", example: "an affluent society", level: "고급" },
  { term: "benevolent", definition: "자비로운, 호의적인", level: "고급" },
  { term: "compelling", definition: "설득력 있는", example: "a compelling argument", level: "중급" },
  { term: "concede", definition: "인정하다, 양보하다", level: "고급" },
  { term: "consensus", definition: "합의, 의견 일치", level: "중급" },
  { term: "contradict", definition: "모순되다, 반박하다", level: "중급" },
  { term: "deliberate", definition: "고의적인 / 숙고하다", level: "중급" },
  { term: "demolish", definition: "철거하다, 부수다", level: "중급" },
  { term: "deteriorate", definition: "악화되다", level: "고급" },
  { term: "diligent", definition: "근면한, 성실한", level: "기초" },
  { term: "discrepancy", definition: "불일치, 차이", level: "고급" },
  { term: "elaborate", definition: "정교한 / 자세히 설명하다", level: "중급" },
  { term: "endorse", definition: "지지하다, 보증하다", level: "중급" },
  { term: "exacerbate", definition: "악화시키다", level: "고급" },
  { term: "feasible", definition: "실행 가능한", level: "중급" },
  { term: "fluctuate", definition: "변동하다", level: "중급" },
  { term: "hinder", definition: "방해하다", level: "중급" },
  { term: "imminent", definition: "임박한", level: "고급" },
  { term: "indispensable", definition: "필수적인", level: "중급" },
  { term: "inevitable", definition: "불가피한", level: "중급" },
  { term: "intricate", definition: "복잡한, 정교한", level: "고급" },
  { term: "lucrative", definition: "수익성 좋은", level: "고급" },
  { term: "meticulous", definition: "꼼꼼한", level: "고급" },
  { term: "mitigate", definition: "완화하다", level: "고급" },
  { term: "nostalgia", definition: "향수, 회고", level: "기초" },
  { term: "obsolete", definition: "구식의, 쓸모없는", level: "중급" },
  { term: "perpetual", definition: "끊임없는, 영구적인", level: "중급" },
  { term: "prevalent", definition: "널리 퍼진", level: "중급" },
  { term: "redundant", definition: "불필요한, 중복된", level: "중급" },
  { term: "reluctant", definition: "꺼리는, 마지못해 하는", level: "기초" },
  { term: "scarce", definition: "부족한, 희귀한", level: "기초" },
  { term: "subtle", definition: "미묘한", level: "중급" },
  { term: "tentative", definition: "잠정적인", level: "중급" },
  { term: "thrive", definition: "번창하다, 성장하다", level: "기초" },
  { term: "vigorous", definition: "활발한, 격렬한", level: "기초" },
  { term: "yield", definition: "양보하다 / 산출하다", level: "기초" },
];
