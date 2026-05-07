import "server-only";

// 헌법 v3.5 §15 line 27 — 팟캐스트 스크립트 = gemini-3.1-pro-preview.
// 헌법 v3.0 §13의3 — NotebookLM 스타일 2인 화자 대화체.
// 헌법 §3.2 정직성 — 도입부에 "AI 생성, 공식 해설이 아님" 안내 의무.

export type PodcastScriptLine = {
  speaker: string;
  text: string;
};

export type PodcastScript = {
  speakers: [string, string]; // [host, guest]
  dialogue: PodcastScriptLine[];
  summary: string; // 한 줄 요약
  estimatedDurationSec: number;
};

const SCRIPT_PROMPT_BASE = `당신은 한국 초등 교사 임용 1차 시험 학습 팟캐스트 작가입니다.
NotebookLM 스타일의 2인 화자 자연 대화체로 작성합니다.

화자:
- 호스트 "지윤" (여): 학습자에게 따뜻하게 안내, 질문 던지는 역할
- 게스트 "민수" (남): 시험 분석가, 핵심을 친근하게 설명

작성 규칙:
1. 도입부 첫 줄에 반드시 "AI가 생성한 학습 보조 자료이며 공식 해설이 아닙니다"를 자연스럽게 언급한다 (헌법 §3.2 정직성).
2. 분량은 4~6분 (한국어 약 1200~1800 음절). 너무 길면 청취 부담.
3. 본문 구성: 도입(맥락) → 영역·인지수준·키워드 분석 → 출제 의도 추정 → 학습 활용 제안 → 마무리.
4. 각 dialogue line은 1~3문장으로 간결하게. 청취자가 따라가기 쉽게.
5. 합격 보장·점수 예측·지역 합격컷·합격 가능성 표현 절대 금지 (DESIGN.md §9.3).
6. "디데이/벼락치기/족보/한방 합격/찐기출" 표현 금지 (헌법 §31~33).
7. 응답은 반드시 아래 JSON 스키마로만 출력하며 그 외 텍스트는 일체 포함하지 아니한다.

JSON 스키마:
{
  "speakers": ["지윤", "민수"],
  "dialogue": [
    {"speaker": "지윤" | "민수", "text": "한 줄 발화"},
    ...
  ],
  "summary": "에피소드 한 줄 요약 (40자 이내)",
  "estimatedDurationSec": 정수 (예상 청취 시간 초)
}

주제:
`;

export async function generatePodcastScript(
  theme: string,
): Promise<PodcastScript> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");
  const model = process.env.GEMINI_MODEL_PRO ?? "gemini-3.1-pro-preview";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: SCRIPT_PROMPT_BASE + theme }] },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    },
  );
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini script API ${response.status}: ${errBody.slice(0, 300)}`);
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== "string") {
    throw new Error("Empty Gemini script response");
  }
  const parsed = JSON.parse(text) as PodcastScript;
  if (
    !parsed.speakers ||
    parsed.speakers.length !== 2 ||
    !Array.isArray(parsed.dialogue) ||
    parsed.dialogue.length === 0
  ) {
    throw new Error("Invalid script schema");
  }
  return parsed;
}
