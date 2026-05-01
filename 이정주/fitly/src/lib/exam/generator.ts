import { getGemini, GEMINI_MODELS } from "@/lib/ai/gemini";
import type { UniversityName } from "@/types";

export type ExamSection = "vocab" | "grammar" | "reading";

export type GeneratedExamItem = {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  keywords: string[];
};

const SYSTEM_INSTRUCTION = `당신은 한국 편입 영어 시험 출제자입니다.
지정된 학교·영역에 맞춘 객관식 문제 1개를 다음 JSON 형식으로만 출력합니다. 코드펜스·머리말 금지.
{
  "question": "영문 또는 한국어 문제 본문",
  "choices": ["보기1", "보기2", "보기3", "보기4"],
  "answer": "정답 보기 텍스트 그대로",
  "explanation": "왜 정답인지 1~2문장 한국어 해설",
  "keywords": ["핵심 어휘 또는 문법 1~3개"]
}
규칙:
- choices는 정확히 4개.
- answer는 choices 중 하나와 정확히 일치해야 합니다.
- 출제 영역(영문법/독해/어휘)에 맞는 난이도로 구성합니다.`;

export async function generateExamItem(
  university: UniversityName,
  section: ExamSection
): Promise<GeneratedExamItem | null> {
  const prompt = `학교: ${university}대\n영역: ${labelOf(section)}\n위 학교의 편입 영어 출제 경향에 맞는 문제 1개를 작성하세요.`;

  const client = getGemini();
  const res = await client.models.generateContent({
    model: GEMINI_MODELS.pro,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
    },
    contents: prompt,
  });

  const raw = res.text ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]) as unknown;
    if (!isExamItem(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function labelOf(s: ExamSection): string {
  return { vocab: "어휘", grammar: "문법", reading: "독해" }[s];
}

function isExamItem(v: unknown): v is GeneratedExamItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.question === "string" &&
    Array.isArray(o.choices) &&
    o.choices.length === 4 &&
    o.choices.every((c) => typeof c === "string") &&
    typeof o.answer === "string" &&
    typeof o.explanation === "string" &&
    Array.isArray(o.keywords) &&
    o.keywords.every((k) => typeof k === "string")
  );
}
