"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, gte, isNull } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  cardReports,
  cards,
  examItems,
  examPapers,
  userAttempts,
  userCardAiAnalysis,
  userCardHighlights,
  userCardLog,
  userCardState,
  userCardTags,
} from "@/lib/db/schema";
import {
  CARD_MARK_KINDS,
  type CardMarkKind,
} from "@/lib/db/schema/user-card-state";
import {
  CARD_REPORT_CATEGORIES,
  type CardReportCategory,
} from "@/lib/db/schema/card-reports";
import {
  reviewCard,
  fsrsCardFromState,
  fsrsCardToState,
  newCard,
  type ReviewGrade,
} from "@/lib/srs";
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
// 2026-05-18 — gradeCard ts-fsrs 통합 + userCardLog 적재 + transaction 원자화
//   * 헌법 §19 (ts-fsrs SRS 큐) 약속 활성화 — lib/srs/index.ts 사용
//   * 헌법 §13의2 6항 (등급 이력 user_card_log append-only) 본 commit 부터 작동
//   * /review CRITICAL C1 (userCardLog INSERT 누락) + C2 (multi-write tx 부재) +
//     H8 (ts-fsrs 미사용) 동시 해소
//
// 입력 검증 (헌법 §28 + /review H4):
//   * UUID 형식 + Grade enum 서버 단 검증 — server action runtime-erasure 의존 차단.

type Grade = ReviewGrade;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CardIdSchema = z.string().regex(UUID_RE, "InvalidCardId");
const GradeSchema = z.enum(["again", "hard", "good", "easy"]);
const AnswerTextSchema = z.string().max(MAX_ANSWER_LEN);

export async function submitAnswer(
  cardId: string,
  answerText: string,
): Promise<void> {
  // 헌법 §28 + /review H4 — Zod 입력 검증 (server action runtime-erasure 차단).
  const cid = CardIdSchema.parse(cardId);
  const text = AnswerTextSchema.parse(answerText);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  if (text.trim().length === 0) return;

  const db = getDb();
  const [card] = await db
    .select({ sourceItemId: cards.sourceItemId })
    .from(cards)
    .where(eq(cards.id, cid))
    .limit(1);
  if (!card?.sourceItemId) return;

  await db.insert(userAttempts).values({
    userId: user.id,
    itemId: card.sourceItemId,
    answerMd: text,
  });
}

export async function gradeCard(cardId: string, grade: Grade): Promise<void> {
  // 헌법 §28 + /review H4 — Zod 입력 검증 (UUID + Grade enum).
  const cid = CardIdSchema.parse(cardId);
  const g = GradeSchema.parse(grade);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const db = getDb();
  const now = new Date();

  // 트랜잭션 (/review C2 — multi-write atomic). 4-단계 sequential write를
  // 원자화하여 중간 실패 시 orphan/중복 mistake 카드 방지.
  await db.transaction(async (tx) => {
    // 원본 카드 + prev fsrs state 조회 (mistake 합류 + ts-fsrs 입력).
    const [origCard] = await tx
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
      .where(eq(cards.id, cid))
      .limit(1);
    if (!origCard) throw new Error("CardNotFound");

    const [prevState] = await tx
      .select({ fsrsState: userCardState.fsrsState })
      .from(userCardState)
      .where(
        and(
          eq(userCardState.userId, user.id),
          eq(userCardState.cardId, cid),
        ),
      )
      .limit(1);

    // 헌법 §19 ts-fsrs 통합 — 이전 placeholder (grade별 하드코딩 interval)
    // 제거하고 scheduler.next() 결과를 그대로 사용.
    const prevCard = prevState?.fsrsState
      ? fsrsCardFromState(prevState.fsrsState, now)
      : newCard(now);
    const { card: nextCard } = reviewCard(prevCard, g, now);
    const fsrsState: SrsState = fsrsCardToState(nextCard);
    const dueAt = nextCard.due;

    // 1) user_card_state upsert (ts-fsrs 산출 next state).
    await tx
      .insert(userCardState)
      .values({
        userId: user.id,
        cardId: cid,
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

    // 2) user_card_log append (헌법 §13의2 6항). /review C1 fix —
    //    종전 INSERT 누락으로 대시보드 plan progress 영구 0%·weak-types 비어있던 회귀 해소.
    await tx.insert(userCardLog).values({
      userId: user.id,
      cardId: cid,
      grade: g,
      reviewedAt: now,
    });

    // 3) 헌법 v3.3 §13의2 5항 — again/hard + quiz/keyword 시 mistake 자동 합류.
    if (
      origCard.sourceItemId &&
      (g === "again" || g === "hard") &&
      (origCard.type === "quiz" || origCard.type === "keyword")
    ) {
      const [existingMistake] = await tx
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
        let mistakeBody = {
          frontText: origCard.frontText,
          frontImagePath: origCard.frontImagePath,
          backMd: origCard.backMd,
          verifiedText: origCard.verifiedText,
          verifiedAnswer: origCard.verifiedAnswer,
        };

        if (origCard.type === "keyword") {
          const [siblingQuiz] = await tx
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

        const [created] = await tx
          .insert(cards)
          .values({
            type: "mistake",
            sourceItemId: origCard.sourceItemId,
            userId: user.id,
            ...mistakeBody,
          })
          .returning({ id: cards.id });

        if (created?.id) {
          // mistake 카드는 즉시 풀이 대상 (dueAt=now + 새 fsrs card state).
          const initialMistakeCard = newCard(now);
          await tx
            .insert(userCardState)
            .values({
              userId: user.id,
              cardId: created.id,
              fsrsState: fsrsCardToState(initialMistakeCard),
              dueAt: now,
              lastReviewedAt: null,
            })
            .onConflictDoNothing({
              target: [userCardState.userId, userCardState.cardId],
            });
        }
      }
    }
  });

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

// 백승환 #9 (2026-05-15) — 카드 마크(북마크 / 별표 / 모르겠음) 토글.
// user_card_state.mark 컬럼 update. row 미존재 시 default fsrsState 로 insert.
// mark=null 전달 시 마크 해제. 트랙 페이지 필터 (?mark=star) 와 정합.
export async function setCardMark(
  cardId: string,
  mark: CardMarkKind | null,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (mark !== null && !CARD_MARK_KINDS.includes(mark)) {
    return { error: "BadMark" };
  }

  const db = getDb();
  const [card] = await db
    .select({ id: cards.id })
    .from(cards)
    .where(eq(cards.id, cardId))
    .limit(1);
  if (!card) return { error: "CardNotFound" };

  const now = new Date();
  // user_card_state 가 없는 카드(아직 학습 전)도 마킹 가능. dueAt = now,
  // FSRS state placeholder 로 row 생성. grade 시 정상 갱신.
  await db
    .insert(userCardState)
    .values({
      userId: user.id,
      cardId,
      mark,
      dueAt: now,
      fsrsState: {
        due: now.toISOString(),
        stability: 0.5,
        difficulty: 5,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        state: 0,
        last_review: now.toISOString(),
      },
    })
    .onConflictDoUpdate({
      target: [userCardState.userId, userCardState.cardId],
      set: { mark, updatedAt: now },
    });

  revalidatePath("/study/quiz");
  revalidatePath("/study/keyword");
  revalidatePath("/study/mistake");
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

// /review H5 — essay LLM 호출 per-user daily cap.
// 헌법 §28 비용 가드 정합. cache hit 은 비용 0 이라 count 대상 외 — cache miss
// 시점에 user_card_ai_analysis.created_at 기준 오늘 INSERT 수를 검사.
// (podcast 5/day 와 분리된 별도 quota — essay 는 학습 본업이므로 상대적 여유.)
const ESSAY_AI_DAILY_LIMIT = 50;

async function essayAiDailyCount(userId: string): Promise<number> {
  const db = getDb();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const [row] = await db
    .select({ n: count() })
    .from(userCardAiAnalysis)
    .where(
      and(
        eq(userCardAiAnalysis.userId, userId),
        gte(userCardAiAnalysis.createdAt, startOfDay),
      ),
    );
  return Number(row?.n ?? 0);
}

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

  // /review H4 — UUID 형식 검증 (server action runtime-erasure 차단).
  const cidResult = CardIdSchema.safeParse(cardId);
  if (!cidResult.success) return { ok: false, error: "InvalidCardId" };
  const cid = cidResult.data;

  const db = getDb();
  const [card] = await db
    .select({ id: cards.id, backMd: cards.backMd, type: cards.type })
    .from(cards)
    .where(eq(cards.id, cid))
    .limit(1);
  if (!card) return { ok: false, error: "CardNotFound" };
  if (!card.backMd) return { ok: false, error: "NoReference" };

  // 코드리뷰 C.H4 (2026-05-15) — backMd 변경 시 캐시 자동 무효화 위해 hash 입력에
  // 모범답안도 포함.
  const attemptHash = computeAttemptHash(answerText, card.backMd);

  // 캐시 hit? — cap 검사 전 우선 적용 (재제출 무료).
  const cached = await getAiAnalysis(user.id, cid, attemptHash);
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

  // /review H5 — cache miss 직전 daily cap. cache hit 은 count 대상 외.
  const todayCount = await essayAiDailyCount(user.id);
  if (todayCount >= ESSAY_AI_DAILY_LIMIT) {
    return { ok: false, error: "DailyLimitExceeded" };
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
        cardId: cid,
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

// 헌법 시행규칙 33 §35 백업 매트릭스 — 사용자 AI 답안 신고 server action.
// 코드리뷰 C.H2 (2026-05-15) — 학습자가 모범답안·해설 오류를 직접 보고할 수 있게
// 하여 정직성 §3의2 보강. 일일 캡으로 어뷰즈 방지.
//
// hotfix (2026-05-15) — 종전 본 파일에서 `REPORT_CATEGORIES` 를 그대로 export
// 하여 Next.js 15 `"use server"` 규칙(비함수 export 금지) 위반 → E352 발동.
// 카테고리 목록은 `schema/card-reports.ts` 로 옮기고 본 파일은 import 만 한다.
const MAX_REPORT_DETAIL_LEN = 1000;
const MAX_REPORTS_PER_DAY = 20;

export type ReportCardResult =
  | { ok: true }
  | { ok: false; error: string };

export async function reportCardIssue(input: {
  cardId: string;
  category: CardReportCategory;
  detail?: string;
}): Promise<ReportCardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  if (!CARD_REPORT_CATEGORIES.includes(input.category)) {
    return { ok: false, error: "InvalidCategory" };
  }

  const detail = input.detail?.trim() || null;
  if (detail && detail.length > MAX_REPORT_DETAIL_LEN) {
    return { ok: false, error: "DetailTooLong" };
  }
  if (input.category === "other" && !detail) {
    return { ok: false, error: "DetailRequired" };
  }

  const db = getDb();

  const [card] = await db
    .select({ id: cards.id })
    .from(cards)
    .where(eq(cards.id, input.cardId))
    .limit(1);
  if (!card) return { ok: false, error: "CardNotFound" };

  // 일일 캡 — 어뷰즈 방지 (UTC 자정 기준).
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const [countRow] = await db
    .select({ n: count() })
    .from(cardReports)
    .where(
      and(
        eq(cardReports.userId, user.id),
        gte(cardReports.createdAt, startOfDay),
      ),
    );
  if (Number(countRow?.n ?? 0) >= MAX_REPORTS_PER_DAY) {
    return { ok: false, error: "DailyLimitExceeded" };
  }

  try {
    await db.insert(cardReports).values({
      cardId: input.cardId,
      userId: user.id,
      category: input.category,
      detail,
    });
    return { ok: true };
  } catch (e) {
    console.error("[reportCardIssue] insert failed", e);
    return { ok: false, error: "InsertFailed" };
  }
}
