"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  cards,
  examItems,
  examPapers,
  userAttempts,
  userCardAiAnalysis,
  userCardHighlights,
  userCardState,
  userCardTags,
} from "@/lib/db/schema";
import type { SrsState } from "@/types";
import {
  analyzeEssay,
  computeAttemptHash,
  MAX_ANSWER_LEN,
} from "@/lib/ai/gemini-essay-analyze";
import {
  chatWithTutor as chatWithTutorLLM,
  type ChatMessage,
  type TutorContext,
} from "@/lib/ai/gemini-tutor-chat";
import {
  getAiAnalysis,
  formatPaperLabel,
  type AiAnalysis,
} from "@/lib/db/queries";

// 헌법 v3.0 제13조의2 — 학습 활동 server actions.
// 답안 저장 + 자가 채점 등급 처리 (현 시점은 단순 spaced repetition,
// ts-fsrs 본격 통합은 D-S2 이후 reimplement — 헌법 제19조 정합).

type Grade = "again" | "hard" | "good" | "easy";

const DAY_MS = 24 * 60 * 60 * 1000;

// FSRS state 갱신은 ts-fsrs 라이브러리 통합 후 본격 reimplement.
// 현 단계는 grade에 따른 단순 인터벌만 적용 (impl placeholder).
const GRADE_INTERVAL_MS: Record<Grade, number> = {
  again: 60 * 1000,
  hard: 10 * 60 * 1000,
  good: 1 * DAY_MS,
  easy: 3 * DAY_MS,
};

export async function submitAnswer(
  cardId: string,
  answerText: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  if (answerText.trim().length === 0) return;

  const db = getDb();
  const [card] = await db
    .select({ sourceItemId: cards.sourceItemId })
    .from(cards)
    .where(eq(cards.id, cardId))
    .limit(1);
  if (!card?.sourceItemId) return;

  await db.insert(userAttempts).values({
    userId: user.id,
    itemId: card.sourceItemId,
    answerMd: answerText,
  });
}

export async function gradeCard(cardId: string, grade: Grade): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const db = getDb();
  const now = new Date();
  const intervalMs = GRADE_INTERVAL_MS[grade];
  const dueAt = new Date(now.getTime() + intervalMs);

  // ts-fsrs state placeholder — 라이브러리 통합 시 src/lib/srs/index.ts를 통해 갱신.
  const fsrsState: SrsState = {
    due: dueAt.toISOString(),
    stability: grade === "easy" ? 3 : grade === "good" ? 1 : 0.5,
    difficulty: grade === "easy" ? 3 : grade === "again" ? 8 : 5,
    elapsed_days: 0,
    scheduled_days: intervalMs / DAY_MS,
    reps: 1,
    lapses: grade === "again" ? 1 : 0,
    state: grade === "again" ? 1 : 2,
    last_review: now.toISOString(),
  };

  // 원본 카드 정보 조회 — type / sourceItemId / 본문은 mistake 합류 시 사용.
  const [origCard] = await db
    .select({
      type: cards.type,
      sourceItemId: cards.sourceItemId,
      frontText: cards.frontText,
      frontImagePath: cards.frontImagePath,
      backMd: cards.backMd,
      verifiedText: cards.verifiedText,
      verifiedAnswer: cards.verifiedAnswer,
    })
    .from(cards)
    .where(eq(cards.id, cardId))
    .limit(1);

  // 원본 카드 user_card_state 갱신.
  await db
    .insert(userCardState)
    .values({
      userId: user.id,
      cardId,
      fsrsState,
      dueAt,
      lastReviewedAt: now,
    })
    .onConflictDoUpdate({
      target: [userCardState.userId, userCardState.cardId],
      set: {
        fsrsState,
        dueAt,
        lastReviewedAt: now,
        updatedAt: now,
      },
    });

  // 헌법 v3.3 제13조의2 5항 — again/hard 평가 시 mistake 트랙 자동 합류.
  // 정책:
  //   1) origCard.type 이 quiz/keyword + grade 가 again/hard 일 때만 합류
  //   2) origCard.type === "mistake" 는 이미 합류된 카드라 skip
  //   3) origCard.sourceItemId 가 NULL 이면 시드 outlier 라 skip
  //   4) 동일 (userId, sourceItemId, type=mistake) 가 이미 있으면 중복 생성 X
  //   5) keyword 원본은 정리 노트(LLM) 이므로 mistake 본문으로 부적합 →
  //      동일 sourceItemId 의 shared quiz 카드(PDF 원본 본문) 찾아 사용.
  //      shared quiz 없으면 keyword 본문 그대로 fallback.
  //   6) 생성된 mistake 카드는 user_card_state 에 dueAt=now 로 추가 (즉시 풀이 대상).
  if (
    origCard?.sourceItemId &&
    (grade === "again" || grade === "hard") &&
    (origCard.type === "quiz" || origCard.type === "keyword")
  ) {
    const [existingMistake] = await db
      .select({ id: cards.id })
      .from(cards)
      .where(
        and(
          eq(cards.sourceItemId, origCard.sourceItemId),
          eq(cards.type, "mistake"),
          eq(cards.userId, user.id),
        ),
      )
      .limit(1);

    if (!existingMistake) {
      // mistake 본문 — quiz 는 원본 그대로, keyword 는 sibling quiz 우선
      let mistakeBody = {
        frontText: origCard.frontText,
        frontImagePath: origCard.frontImagePath,
        backMd: origCard.backMd,
        verifiedText: origCard.verifiedText,
        verifiedAnswer: origCard.verifiedAnswer,
      };

      if (origCard.type === "keyword") {
        const [siblingQuiz] = await db
          .select({
            frontText: cards.frontText,
            frontImagePath: cards.frontImagePath,
            backMd: cards.backMd,
            verifiedText: cards.verifiedText,
            verifiedAnswer: cards.verifiedAnswer,
          })
          .from(cards)
          .where(
            and(
              eq(cards.sourceItemId, origCard.sourceItemId),
              eq(cards.type, "quiz"),
              isNull(cards.userId),
            ),
          )
          .limit(1);
        if (siblingQuiz) mistakeBody = siblingQuiz;
      }

      const [created] = await db
        .insert(cards)
        .values({
          type: "mistake",
          sourceItemId: origCard.sourceItemId,
          userId: user.id,
          ...mistakeBody,
        })
        .returning({ id: cards.id });

      if (created?.id) {
        await db
          .insert(userCardState)
          .values({
            userId: user.id,
            cardId: created.id,
            fsrsState: {
              due: now.toISOString(),
              stability: 0.5,
              difficulty: 6,
              elapsed_days: 0,
              scheduled_days: 0,
              reps: 0,
              lapses: 0,
              state: 0,
              last_review: now.toISOString(),
            },
            dueAt: now,
            lastReviewedAt: null,
          })
          .onConflictDoNothing({
            target: [userCardState.userId, userCardState.cardId],
          });
      }
    }
  }

  revalidatePath("/study/quiz");
  revalidatePath("/study/keyword");
  revalidatePath("/study/mistake");
  revalidatePath("/study-plan");
  revalidatePath("/dashboard");
}

// 헌법 v3.5.1 제16조 — 사용자 형광펜/밑줄 server actions.
// 카드 본문 인터랙션 다듬기 (시행규칙 32 제34조 정합).
// 색 변경은 delete + insert 로 처리한다 (마이그레이션 0013 정합).

type HighlightColor = "yellow" | "green" | "pink" | "underline";
type HighlightSurface = "back_md" | "front_text";

const VALID_COLORS: HighlightColor[] = ["yellow", "green", "pink", "underline"];
const VALID_SURFACES: HighlightSurface[] = ["back_md", "front_text"];

// prefix/suffix 컨텍스트 길이 상한 — anchor 매칭 정확도 vs 저장 비용 균형.
const ANCHOR_CONTEXT_MAX = 20;
const QUOTE_MAX = 2000;

export async function createHighlight(input: {
  cardId: string;
  surface: HighlightSurface;
  quote: string;
  prefix?: string;
  suffix?: string;
  color: HighlightColor;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!VALID_SURFACES.includes(input.surface)) return { error: "BadSurface" };
  if (!VALID_COLORS.includes(input.color)) return { error: "BadColor" };
  const quote = input.quote.trim();
  if (quote.length === 0 || quote.length > QUOTE_MAX) {
    return { error: "BadQuote" };
  }
  const prefix = (input.prefix ?? "").slice(-ANCHOR_CONTEXT_MAX);
  const suffix = (input.suffix ?? "").slice(0, ANCHOR_CONTEXT_MAX);

  const db = getDb();
  const [card] = await db
    .select({ id: cards.id })
    .from(cards)
    .where(eq(cards.id, input.cardId))
    .limit(1);
  if (!card) return { error: "CardNotFound" };

  const [created] = await db
    .insert(userCardHighlights)
    .values({
      userId: user.id,
      cardId: input.cardId,
      surface: input.surface,
      quote,
      prefix,
      suffix,
      color: input.color,
    })
    .returning({ id: userCardHighlights.id });

  return { id: created.id };
}

export async function deleteHighlight(
  highlightId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const db = getDb();
  await db
    .delete(userCardHighlights)
    .where(
      and(
        eq(userCardHighlights.id, highlightId),
        eq(userCardHighlights.userId, user.id),
      ),
    );
  return { ok: true };
}

// 헌법 v3.5.1 제16조 — 사용자 커스텀 해시태그 server actions. 카드 메타 다듬기.
// 카드당 12개 상한 (시드 태깅 5개 상한과 분리 — 본 영역은 운영자 시드가 아닌
// 사용자 메타라 더 넉넉히 허용).

const TAG_LENGTH_MAX = 32;
const TAGS_PER_CARD_MAX = 12;

function normalizeTag(raw: string): string | null {
  // # 접두 제거 + trim + 내부 공백 → 하이픈 + 32자 절단.
  let t = raw.trim().replace(/^#+/, "").trim();
  if (!t) return null;
  t = t.replace(/\s+/g, "-");
  // 제어/특수 문자 일부 제거 (공백/하이픈/언더스코어/한글/영숫자만 허용).
  t = t.replace(/[^\p{L}\p{N}_-]/gu, "");
  if (!t) return null;
  if (t.length > TAG_LENGTH_MAX) t = t.slice(0, TAG_LENGTH_MAX);
  return t;
}

export async function addCardTag(
  cardId: string,
  rawTag: string,
): Promise<{ id: string; tag: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const tag = normalizeTag(rawTag);
  if (!tag) return { error: "BadTag" };

  const db = getDb();
  const [card] = await db
    .select({ id: cards.id })
    .from(cards)
    .where(eq(cards.id, cardId))
    .limit(1);
  if (!card) return { error: "CardNotFound" };

  // 카드당 상한 검사.
  const [{ cnt }] = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(userCardTags)
    .where(
      and(
        eq(userCardTags.userId, user.id),
        eq(userCardTags.cardId, cardId),
      ),
    );
  if ((cnt ?? 0) >= TAGS_PER_CARD_MAX) return { error: "TooMany" };

  // upsert — unique 충돌 시 onConflictDoNothing.
  const inserted = await db
    .insert(userCardTags)
    .values({ userId: user.id, cardId, tag })
    .onConflictDoNothing({
      target: [userCardTags.userId, userCardTags.cardId, userCardTags.tag],
    })
    .returning({ id: userCardTags.id, tag: userCardTags.tag });

  if (inserted.length === 0) return { error: "Duplicate" };
  return { id: inserted[0].id, tag: inserted[0].tag };
}

export async function removeCardTag(
  tagId: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const db = getDb();
  await db
    .delete(userCardTags)
    .where(
      and(
        eq(userCardTags.id, tagId),
        eq(userCardTags.userId, user.id),
      ),
    );
  return { ok: true };
}

// 헌법 v3.5.1 제16조 + 2026-05-14 brainstorming PR 2/6 — AI 서술형 분석 요청.
// 캐시(user_card_ai_analysis) hit/miss 로직 → miss 시 Gemini Flash 호출 →
// upsert 후 반환. UI(AnalysisPanel) 는 PR 3 부터 본 action 을 호출한다.
//
// 정책
//   - 카드의 backMd 부재 시 분석 거부 (UI 에서 placeholder 처리).
//   - 답안 빈 문자열도 허용 — "빈 답안" 으로 LLM 분석.
//   - attempt_hash 는 정규화(normalizeAnswer) 후 SHA-1.

export type RequestAiAnalysisResult =
  | {
      ok: true;
      cached: boolean;
      attemptHash: string;
      overview: AiAnalysis["overview"];
      keywords: AiAnalysis["keywords"];
      diff: AiAnalysis["diff"];
      model: string;
    }
  | { ok: false; error: string };

export async function requestAiAnalysis(
  cardId: string,
  answerText: string,
): Promise<RequestAiAnalysisResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  // 코드리뷰 C.H3 (2026-05-15) — 답안 길이 서버 측 상한. 클라이언트 카운터만으로는
  // 비용 폭주 방어가 불가. MAX_ANSWER_LEN 초과 시 422 의미의 명시 에러 반환.
  if (typeof answerText !== "string") {
    return { ok: false, error: "InvalidAnswer" };
  }
  if (answerText.length > MAX_ANSWER_LEN) {
    return { ok: false, error: "AnswerTooLong" };
  }

  const db = getDb();
  const [card] = await db
    .select({ id: cards.id, backMd: cards.backMd, type: cards.type })
    .from(cards)
    .where(eq(cards.id, cardId))
    .limit(1);
  if (!card) return { ok: false, error: "CardNotFound" };
  if (!card.backMd) return { ok: false, error: "NoReference" };

  // 코드리뷰 C.H4 (2026-05-15) — backMd 변경 시 캐시 자동 무효화 위해 hash 입력에
  // 모범답안도 포함.
  const attemptHash = computeAttemptHash(answerText, card.backMd);

  // 캐시 hit?
  const cached = await getAiAnalysis(user.id, cardId, attemptHash);
  if (cached) {
    return {
      ok: true,
      cached: true,
      attemptHash,
      overview: cached.overview,
      keywords: cached.keywords,
      diff: cached.diff,
      model: cached.model,
    };
  }

  // miss → LLM 호출.
  try {
    const result = await analyzeEssay({
      referenceMd: card.backMd,
      userAnswer: answerText,
    });

    await db
      .insert(userCardAiAnalysis)
      .values({
        userId: user.id,
        cardId,
        attemptHash,
        overviewJson: result.overview,
        keywordsJson: result.keywords,
        diffJson: result.diff,
        model: result.model,
      })
      .onConflictDoNothing({
        target: [
          userCardAiAnalysis.userId,
          userCardAiAnalysis.cardId,
          userCardAiAnalysis.attemptHash,
        ],
      });

    return {
      ok: true,
      cached: false,
      attemptHash,
      overview: result.overview,
      keywords: result.keywords,
      diff: result.diff,
      model: result.model,
    };
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error(`[requestAiAnalysis] LLM call failed. cause=${msg}`);
    return { ok: false, error: "LlmFailed" };
  }
}

// 헌법 v3.6.1 §16 단서 + §18 A 매트릭스 (튜터 챗봇 행) — PR 6/6.
// 카드 컨텍스트(본문·모범답안·사용자 답안·AI 분석 캐시) 자동 주입 후 Gemini
// Flash multi-turn 호출. 대화 history 는 클라이언트가 보존 (세션 메모리 +
// localStorage). 본 server action 은 single-turn 처리이며 history 는 클라이언트
// 가 매 호출마다 전체 전송.

export type ChatTutorResult =
  | { ok: true; reply: string; model: string }
  | { ok: false; error: string };

const MAX_MESSAGE_LEN = 2000;

export async function chatWithTutor(input: {
  cardId: string;
  userAnswer: string;
  history: ChatMessage[];
  newMessage: string;
}): Promise<ChatTutorResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const msg = input.newMessage.trim();
  if (!msg) return { ok: false, error: "EmptyMessage" };
  if (msg.length > MAX_MESSAGE_LEN) return { ok: false, error: "TooLong" };

  const db = getDb();
  // 카드 + paper label 조인 — Tutor 컨텍스트.
  const [row] = await db
    .select({
      backMd: cards.backMd,
      frontText: cards.frontText,
      paperYear: examPapers.year,
      paperSession: examPapers.session,
      itemNo: examItems.itemNo,
    })
    .from(cards)
    .leftJoin(examItems, eq(cards.sourceItemId, examItems.id))
    .leftJoin(examPapers, eq(examItems.paperId, examPapers.id))
    .where(eq(cards.id, input.cardId))
    .limit(1);

  if (!row) return { ok: false, error: "CardNotFound" };
  if (!row.backMd) return { ok: false, error: "NoReference" };

  // AI 분석 캐시 hit 여부 확인 — 있으면 system instruction 에 포함.
  // 코드리뷰 C.H4 (2026-05-15) — backMd 동반 해시.
  const attemptHash = computeAttemptHash(input.userAnswer, row.backMd);
  const cached = await getAiAnalysis(user.id, input.cardId, attemptHash);

  const ctx: TutorContext = {
    paperLabel: formatPaperLabel(row.paperYear, row.paperSession, row.itemNo),
    frontText: row.frontText ?? "",
    backMd: row.backMd,
    userAnswer: input.userAnswer,
    analysis: cached
      ? { overview: cached.overview, keywords: cached.keywords }
      : null,
  };

  try {
    const { reply, model } = await chatWithTutorLLM(ctx, input.history, msg);
    return { ok: true, reply, model };
  } catch (e) {
    const errMsg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error(`[chatWithTutor] LLM call failed. cause=${errMsg}`);
    return { ok: false, error: "LlmFailed" };
  }
}
