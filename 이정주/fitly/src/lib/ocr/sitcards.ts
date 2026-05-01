import { getGemini, GEMINI_MODELS } from "@/lib/ai/gemini";
import type { Sitcard } from "@/types";

const SYSTEM_INSTRUCTION = `당신은 한국 편입 영어 시험지를 시카드(study card)로 변환하는 어시스턴트입니다.
입력 텍스트에서 문제 단위로 분리하여 다음 JSON 배열만 출력합니다. 설명·머리말·코드펜스 금지.
[
  {
    "question": "문제 본문",
    "choices": ["보기1", "보기2", "..."],
    "answer": "정답 또는 정답 번호",
    "explanation": "한 줄 해설 (없으면 빈 문자열)",
    "keywords": ["핵심 단어1", "핵심 단어2"]
  }
]
규칙:
- choices가 없는 주관식이면 choices 필드를 생략합니다.
- answer를 추정하지 말고 원문에 있을 때만 채웁니다.
- keywords는 학습 가치가 높은 어휘·문법 포인트 1~5개.`;

export async function extractSitcards(text: string): Promise<Sitcard[]> {
  if (!text.trim()) return [];

  const client = getGemini();
  const res = await client.models.generateContent({
    model: GEMINI_MODELS.pro,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
    },
    contents: text,
  });

  const raw = res.text ?? "";
  const match = raw.match(/\[[\s\S]*\]/);
  const source = match ? match[0] : raw;

  try {
    const parsed = JSON.parse(source) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSitcard);
  } catch {
    return [];
  }
}

function isSitcard(v: unknown): v is Sitcard {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.question === "string" &&
    Array.isArray(o.keywords) &&
    o.keywords.every((k) => typeof k === "string")
  );
}
