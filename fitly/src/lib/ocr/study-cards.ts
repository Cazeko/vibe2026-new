import { getGemini, GEMINI_MODELS } from "@/lib/ai/gemini";
import type { MistakeCard } from "@/types";

// 헌법 v1.11 제13조의2 — StudyCard 추출용 프롬프트.
// MistakeCard 와 달리 학습용이므로 정답·해설을 AI 추정으로 채우되,
// 헌법 제18조의2 — 모든 카드는 answerSource='ai_estimate' = "검증 필요" 라벨로 표시.
// 사용자가 풀어보고 정정하면 user_self_corrected 로 승격됨 (제30조의2).
const SYSTEM_INSTRUCTION = `당신은 한국 편입 영어 시험지를 학습 카드(study card)로 변환하는 어시스턴트입니다.
입력 텍스트에서 문제 단위로 분리하여 다음 JSON 배열만 출력합니다. 설명·머리말·코드펜스 금지.
[
  {
    "question": "문제 본문",
    "choices": ["보기1", "보기2", "..."],
    "answer": "정답 또는 정답 번호",
    "explanation": "1~2 문장 해설",
    "keywords": ["핵심 단어1", "핵심 단어2"]
  }
]
규칙:
- choices가 없는 주관식이면 choices 필드를 생략합니다.
- answer 는 원문에 명시되어 있으면 그대로, 없으면 *학습 가치를 위해 본인의 추론으로 채웁니다*.
  (전체 결과에 "검증 필요" 라벨이 자동 부착되므로 정답 추정이 허용됩니다.)
- explanation 은 왜 그 답인지 1~2 문장으로 짧게.
- keywords 는 학습 가치가 높은 어휘·문법 포인트 1~5개.`;

export async function extractStudyCards(text: string): Promise<MistakeCard[]> {
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
    return parsed.filter(isStudyCard);
  } catch {
    return [];
  }
}

function isStudyCard(v: unknown): v is MistakeCard {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.question === "string" &&
    Array.isArray(o.keywords) &&
    o.keywords.every((k) => typeof k === "string")
  );
}
