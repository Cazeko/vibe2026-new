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
2. 분량은 1~2분 (한국어 약 250~500 음절). dialogue 항목은 *최대 8 lines* 이내로 작성한다 (TTS 합성 시간 한도 — Vercel Hobby 60초 안에서 안전하게 끝나야 함).
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

// /review L2 — API key 를 URL query 가 아닌 x-goog-api-key 헤더로 전달.
// Vercel access log 등에 API key 가 평문 노출되던 위험 차단.
// /review M5 — AbortController 로 20초 timeout. script + TTS 합산 60초 안에
// 안전하게 완료되도록 script 호출은 20초 안 (TTS 가 30~50초 소요 가능).
const SCRIPT_TIMEOUT_MS = 20_000;

async function callGemini(
  model: string,
  apiKey: string,
  prompt: string,
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; body: string }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
      signal: AbortSignal.timeout(SCRIPT_TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    const body = await response.text();
    return { ok: false, status: response.status, body };
  }
  return { ok: true, data: await response.json() };
}

export async function generatePodcastScript(
  theme: string,
): Promise<PodcastScript> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  // 헌법 §35 백업 — preview 모델 503/429/500 일시 과부하 시 stable model로 fallback.
  // 사용자 체감은 응답 약간 느려질 뿐, 성공률 99%+. preview 모델 가용성 spike 회피.
  // Default를 Flash로 — Vercel Hobby 60초 한도 안에서 script(빠름) + TTS(긴) 합산 정합.
  //
  // 코드리뷰 L6 (2026-05-15) — 변수명-default 의미 불일치 정합.
  // 종전 `GEMINI_MODEL_PRO` (default flash) ⇄ `GEMINI_MODEL_PRO_FALLBACK` (default pro)
  // 의 의미가 뒤집혀 있어 새 진입자 혼선 + 운영 설정 오작동 위험. 전용 변수명으로
  // 분리하고 legacy 변수는 fallback 으로 계속 인식 (운영 환경 무중단 정합).
  const PRIMARY =
    process.env.PODCAST_SCRIPT_MODEL ??
    process.env.GEMINI_MODEL_PRO ??
    "gemini-2.5-flash";
  const FALLBACK =
    process.env.PODCAST_SCRIPT_MODEL_FALLBACK ??
    process.env.GEMINI_MODEL_PRO_FALLBACK ??
    "gemini-2.5-pro";
  const prompt = SCRIPT_PROMPT_BASE + theme;

  let result = await callGemini(PRIMARY, apiKey, prompt);
  if (
    !result.ok &&
    (result.status === 503 || result.status === 429 || result.status === 500)
  ) {
    console.warn(
      `[podcast/script] ${PRIMARY} ${result.status} — falling back to ${FALLBACK}`,
    );
    result = await callGemini(FALLBACK, apiKey, prompt);
  }
  if (!result.ok) {
    throw new Error(
      `Gemini script API ${result.status}: ${result.body.slice(0, 300)}`,
    );
  }
  const data = result.data as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== "string") {
    throw new Error("Empty Gemini script response");
  }
  // PR-004 — JSON.parse 폴백 (Gemini가 ```json``` 펜스 끼는 경우 대비)
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    raw = JSON.parse(stripped);
  }

  // /review H6 fix — per-line schema validation. 종전 `parsed as PodcastScript`
  // 캐스트는 잘못된 dialogue line (`{speaker:null,text:undefined}`) 이 TTS 에
  // "null: undefined\n..." 로 흘러가는 경로를 허용했음.
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid script: not an object");
  }
  const r = raw as Record<string, unknown>;
  if (
    !Array.isArray(r.speakers) ||
    r.speakers.length !== 2 ||
    typeof r.speakers[0] !== "string" ||
    typeof r.speakers[1] !== "string" ||
    !r.speakers[0].trim() ||
    !r.speakers[1].trim()
  ) {
    throw new Error("Invalid script: speakers");
  }
  if (!Array.isArray(r.dialogue) || r.dialogue.length === 0) {
    throw new Error("Invalid script: dialogue empty");
  }
  const speakers: [string, string] = [r.speakers[0], r.speakers[1]];
  const speakerSet = new Set(speakers);
  const dialogue: PodcastScriptLine[] = [];
  for (const item of r.dialogue) {
    if (!item || typeof item !== "object") continue;
    const li = item as Record<string, unknown>;
    const sp = typeof li.speaker === "string" ? li.speaker.trim() : "";
    const tx = typeof li.text === "string" ? li.text.trim() : "";
    if (!sp || !tx) continue;
    if (!speakerSet.has(sp)) continue; // 화자 allowlist 강제.
    dialogue.push({ speaker: sp, text: tx });
  }
  if (dialogue.length === 0) {
    throw new Error("Invalid script: no valid dialogue lines");
  }
  // dialogue 길이 강제 제한 (TTS 합성 + Vercel 60초 한도). 8 line ≈ 1-2분 audio.
  const cappedDialogue = dialogue.slice(0, 8);

  // /review H7 fix — 헌법 §3의2 정직성 서버 강제. 종전 disclaimer 는 프롬프트
  // 만으로 강제했으나 temperature=0.7 에서 LLM 이 누락 가능. 도입부 dialogue
  // 텍스트에 "AI" 또는 "공식 해설" 키워드 누락 시 hardcoded 라인 prepend.
  const disclaimerLine: PodcastScriptLine = {
    speaker: speakers[0],
    text: "AI가 생성한 학습 보조 자료이며 공식 해설이 아닙니다.",
  };
  const firstLineText = cappedDialogue[0]?.text ?? "";
  const hasDisclaimer =
    /AI/i.test(firstLineText) &&
    (/공식 해설/.test(firstLineText) ||
      /학습 보조 자료/.test(firstLineText));
  const finalDialogue = hasDisclaimer
    ? cappedDialogue
    : [disclaimerLine, ...cappedDialogue].slice(0, 8);

  const summary =
    typeof r.summary === "string" && r.summary.trim()
      ? r.summary.trim()
      : "";
  const estimatedDurationSec =
    typeof r.estimatedDurationSec === "number" &&
    Number.isFinite(r.estimatedDurationSec)
      ? Math.max(0, Math.round(r.estimatedDurationSec))
      : 90;

  return {
    speakers,
    dialogue: finalDialogue,
    summary,
    estimatedDurationSec,
  };
}
