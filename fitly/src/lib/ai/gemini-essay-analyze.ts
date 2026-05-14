import { createHash } from "node:crypto";
import { getGemini, GEMINI_MODELS } from "./gemini";
import type {
  DiffJson,
  KeywordsJson,
  OverviewJson,
} from "@/lib/db/schema/user-card-ai-analysis";

// 헌법 v3.5.1 제16조 + 2026-05-14 brainstorming PR 2/6 — 서술형 답안 AI 분석.
// Gemini Flash 단일 호출로 강점/보완점/누락 키워드 + 키워드 매칭 + 라인 단위
// diff 를 JSON 으로 반환한다.
//
// 정합
//   - 헌법 제3조의2 (정직성) — 정성 피드백만. 점수·합격 가능성 표기 금지.
//   - 헌법 제18조 (AI 모델) — Flash 티어 단일 공급자.
//   - 시행규칙 33 제35조 — LLM 응답 파싱 실패 시 안전 fallback.

export type EssayAnalysisInput = {
  referenceMd: string; // 모범답안 markdown
  userAnswer: string; // 사용자 답안 (raw)
};

export type EssayAnalysisResult = {
  overview: OverviewJson;
  keywords: KeywordsJson;
  diff: DiffJson;
  model: string;
};

// 답안 정규화 — trim + 내부 공백 단일 공백으로 압축 + lowercase.
// 동일 답안 재제출 시 캐시 hit 되도록 안정 해시 입력 보장.
export function normalizeAnswer(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

export function computeAttemptHash(answer: string): string {
  const norm = normalizeAnswer(answer);
  return createHash("sha1").update(norm, "utf8").digest("hex");
}

// LLM system + user prompt 빌더. 헌법 제24조의2 (헌법 근거 의무) — 정책을
// system prompt 에 명시 인용한다.
function buildPrompt(input: EssayAnalysisInput): string {
  return [
    "당신은 한국 초등교사 임용 1차 서술형 답안 첨삭 교수입니다.",
    "다음 정책을 반드시 준수합니다 (Fitly 헌법 §3의2 정합).",
    "1. 점수(예: 18/20)·합격 가능성·합격 컷 추정 표기 절대 금지.",
    "2. 정성 피드백만 — 강점·보완점·누락 키워드.",
    "3. 모든 출력은 존댓말. 한국 교육 용어 정합.",
    "",
    "[모범답안]",
    input.referenceMd,
    "",
    "[학습자 답안]",
    input.userAnswer || "(빈 답안)",
    "",
    "다음 JSON 스키마로만 응답하십시오 (코드 펜스·여분 문구 금지).",
    "{",
    '  "overview": {',
    '    "strengths": ["짧고 구체적인 강점 (1~2문장) × 최대 3개"],',
    '    "improvements": ["보완할 점 (1~2문장) × 최대 3개"],',
    '    "missing_keywords": ["답안에서 빠진 핵심 키워드 × 최대 5개"]',
    "  },",
    '  "keywords": {',
    '    "reference": [',
    '      {"text": "모범답안의 핵심 키워드", "matched": true|false}',
    "    ]",
    "  },",
    '  "diff": {',
    '    "segments": [',
    '      {"type": "common|missing|extra", "text": "분할된 의미 단위 텍스트"}',
    "    ]",
    "  }",
    "}",
    "키워드는 5~10개. diff segments 는 모범답안 기준 의미 단위 분할로,",
    "common(공통)·missing(모범에 있고 답안에 없음)·extra(답안에만 있음)를 모두 다룹니다.",
    "빈 답안이면 모든 키워드 matched=false, segments 는 모두 missing 으로 처리합니다.",
  ].join("\n");
}

// Gemini 응답에서 JSON 만 추출. 코드 펜스가 섞여도 강건하게.
function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (fenced) return fenced[1].trim();
  // 첫 { 부터 마지막 } 까지.
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

function safeParse(text: string): {
  overview: OverviewJson;
  keywords: KeywordsJson;
  diff: DiffJson;
} {
  const fallback = {
    overview: { strengths: [], improvements: [], missing_keywords: [] },
    keywords: { reference: [] },
    diff: { segments: [] },
  };
  try {
    const raw = JSON.parse(extractJson(text));
    const overview = raw?.overview ?? {};
    const keywords = raw?.keywords ?? {};
    const diff = raw?.diff ?? {};
    return {
      overview: {
        strengths: Array.isArray(overview.strengths)
          ? overview.strengths.filter((s: unknown) => typeof s === "string").slice(0, 3)
          : [],
        improvements: Array.isArray(overview.improvements)
          ? overview.improvements
              .filter((s: unknown) => typeof s === "string")
              .slice(0, 3)
          : [],
        missing_keywords: Array.isArray(overview.missing_keywords)
          ? overview.missing_keywords
              .filter((s: unknown) => typeof s === "string")
              .slice(0, 5)
          : [],
      },
      keywords: {
        reference: Array.isArray(keywords.reference)
          ? keywords.reference
              .filter(
                (k: unknown) =>
                  typeof k === "object" &&
                  k !== null &&
                  typeof (k as { text?: unknown }).text === "string",
              )
              .map((k: { text: string; matched?: unknown }) => ({
                text: k.text,
                matched: Boolean(k.matched),
              }))
              .slice(0, 12)
          : [],
      },
      diff: {
        segments: Array.isArray(diff.segments)
          ? diff.segments
              .filter(
                (s: unknown) =>
                  typeof s === "object" &&
                  s !== null &&
                  typeof (s as { text?: unknown }).text === "string" &&
                  ["common", "missing", "extra"].includes(
                    (s as { type?: unknown }).type as string,
                  ),
              )
              .map((s: { type: DiffJson["segments"][number]["type"]; text: string }) => ({
                type: s.type,
                text: s.text,
              }))
              .slice(0, 60)
          : [],
      },
    };
  } catch (e) {
    console.error("[gemini-essay-analyze] JSON parse failed → fallback", e);
    return fallback;
  }
}

export async function analyzeEssay(
  input: EssayAnalysisInput,
): Promise<EssayAnalysisResult> {
  const gemini = getGemini();
  const model = GEMINI_MODELS.flash;

  const response = await gemini.models.generateContent({
    model,
    contents: buildPrompt(input),
    config: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });

  const text =
    typeof response.text === "string"
      ? response.text
      : response.text != null
        ? String(response.text)
        : "";

  const parsed = safeParse(text);
  return { ...parsed, model };
}
