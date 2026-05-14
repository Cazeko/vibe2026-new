import { getGemini, GEMINI_MODELS } from "./gemini";
import type {
  OverviewJson,
  KeywordsJson,
} from "@/lib/db/schema/user-card-ai-analysis";

// 헌법 v3.6.1 §16 단서 + §18 A 매트릭스 신규 행 — AI 학습 도우미 챗봇.
// PR 6/6 (feat/assistant-fab). multi-turn 대화, 카드 컨텍스트 자동 주입.
//
// 정합
//   - 헌법 §3의2 (정직성) — 점수·합격 가능성 표기 금지. system instruction 명시.
//   - 헌법 §0 — 학습자(주인님) 호칭 + 존댓말 절대 우선. (다만 본 챗봇은 일반 학습자
//     대상 서비스이므로 "주인님" 호칭은 미적용. "학습자"·일반 존댓말로 통일.)
//   - 헌법 §16 단서 v3.6.1 — 학습 본업(풀이 트랙) 한정.
//   - 헌법 §24의2 (헌법 근거 의무) — 정직성 정책을 system instruction 에 명시 인용.

export type ChatRole = "user" | "model";
export type ChatMessage = { role: ChatRole; text: string };

export type TutorContext = {
  paperLabel: string | null;
  frontText: string;
  backMd: string;
  userAnswer: string; // 빈 문자열 허용
  analysis: {
    overview: OverviewJson;
    keywords: KeywordsJson;
  } | null; // AI 분석 결과 캐시. 없으면 null
};

const MAX_HISTORY_TURNS = 16;
// hotfix (2026-05-14) — 800 토큰은 한글 약 500자로 학술 답변(체육과 교육과정
// 등) 이 중간에 잘리는 사례 발생. 4096 으로 격상 — 한글 약 2500자 ≈ 답안 + 해설
// 풍부히 수용. 비용은 입력 토큰 (system instruction + history) 가 크므로 출력
// 토큰 증가는 호출당 ~0.2원 영향 추정. Gemini Flash maxOutputTokens 상한 정합.
const MAX_REPLY_TOKENS = 4096;

export function buildSystemInstruction(ctx: TutorContext): string {
  const parts: string[] = [];

  parts.push(
    "당신은 한국 초등교사 임용 1차 서술형 학습의 친절하고 정확한 튜터입니다.",
  );
  parts.push("");
  parts.push("[정책 — Fitly 헌법 §3의2·§0 정합]");
  parts.push("1. 모든 응답은 존댓말. 한국 교육 용어 정합.");
  parts.push(
    "2. 점수(예: 18/20·합격 가능성·지역 합격 컷 추정) 표기 절대 금지.",
  );
  parts.push("3. 학습자의 강점·보완점을 정성적으로 안내합니다.");
  parts.push(
    "4. 모범답안은 [모범답안] 섹션을 참고하되, 그대로 인용하지 말고 학습자 질문 맥락에 맞게 설명합니다.",
  );
  parts.push(
    "5. 답안 작성·암기·심화 학습 등 학습 활동의 *보조* 역할이며, 학습자를 대신해 풀이를 작성하지 않습니다.",
  );
  parts.push(
    "6. 외부 강사·학원·족보 등 특정 비공개 자료를 권유하지 않습니다.",
  );
  parts.push("");

  if (ctx.paperLabel) {
    parts.push(`[카드 출처] ${ctx.paperLabel}`);
  }

  if (ctx.frontText) {
    parts.push("[본문]");
    parts.push(ctx.frontText.slice(0, 4000));
  }

  parts.push("");
  parts.push("[모범답안]");
  parts.push(ctx.backMd);

  parts.push("");
  parts.push("[학습자 답안]");
  parts.push(ctx.userAnswer.trim().length > 0 ? ctx.userAnswer : "(빈 답안)");

  if (ctx.analysis) {
    parts.push("");
    parts.push("[AI 정성 분석 요약]");
    const s = ctx.analysis.overview.strengths;
    const im = ctx.analysis.overview.improvements;
    const mk = ctx.analysis.overview.missing_keywords;
    if (s.length) parts.push(`강점: ${s.join(" / ")}`);
    if (im.length) parts.push(`보완점: ${im.join(" / ")}`);
    if (mk.length) parts.push(`누락 키워드: ${mk.join(", ")}`);
  }

  return parts.join("\n");
}

// 대화 history 를 Gemini contents 포맷으로 변환. 토큰 절약 위해 최근 N 턴만.
function historyToContents(history: ChatMessage[], newMessage: string) {
  const trimmed = history.slice(-MAX_HISTORY_TURNS);
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  for (const m of trimmed) {
    contents.push({ role: m.role, parts: [{ text: m.text }] });
  }
  contents.push({ role: "user", parts: [{ text: newMessage }] });
  return contents;
}

export async function chatWithTutor(
  ctx: TutorContext,
  history: ChatMessage[],
  newMessage: string,
): Promise<{ reply: string; model: string }> {
  const gemini = getGemini();
  const model = GEMINI_MODELS.flash;
  const systemInstruction = buildSystemInstruction(ctx);
  const contents = historyToContents(history, newMessage);

  try {
    const response = await gemini.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: MAX_REPLY_TOKENS,
      },
    });

    const reply =
      typeof response.text === "string"
        ? response.text
        : response.text != null
          ? String(response.text)
          : "";
    return { reply: reply.trim(), model };
  } catch (e) {
    // PR 6 이후 hotfix — LlmFailed 진단을 위해 모델 ID 동반 로깅.
    console.error(
      `[gemini-tutor-chat] generateContent failed. model=${model} historyTurns=${history.length} messageLen=${newMessage.length}`,
      e,
    );
    throw e;
  }
}
