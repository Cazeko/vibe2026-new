import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { cards } from "./cards";

// 헌법 v3.5.1 제16조 + 2026-05-14 brainstorming PR 2/6 — AI 서술형 학습
// 워크스페이스 분석 캐시. 풀이/오답 트랙 채점 후 Gemini 정성 피드백을
// (user, card, attempt_hash) 단위로 캐시하여 LLM 재호출을 막는다.
//
// attempt_hash — 답안 정규화(trim + 내부 공백 압축 + lowercase) 후 SHA-1 hex.
// 동일 답안 재제출 시 캐시 hit, 답안 변경 시 신규 row 생성.
//
// 정합
//   - 헌법 제3조의2 (정직성) — overview_json 은 정성 피드백만. 점수 표기 X.
//   - 헌법 제18조 (AI 모델) — model 컬럼에 ID 감사 추적.

export type OverviewJson = {
  strengths: string[];
  improvements: string[];
  missing_keywords: string[];
};

export type KeywordMatch = { text: string; matched: boolean };
export type KeywordsJson = { reference: KeywordMatch[] };

export type DiffSegment = {
  type: "common" | "missing" | "extra";
  text: string;
};
export type DiffJson = { segments: DiffSegment[] };

export const userCardAiAnalysis = pgTable(
  "user_card_ai_analysis",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    attemptHash: varchar("attempt_hash", { length: 40 }).notNull(),
    overviewJson: jsonb("overview_json").$type<OverviewJson>().notNull(),
    keywordsJson: jsonb("keywords_json").$type<KeywordsJson>().notNull(),
    diffJson: jsonb("diff_json").$type<DiffJson>().notNull(),
    model: varchar("model", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userCardAttemptUq: uniqueIndex("user_card_ai_analysis_uq").on(
      t.userId,
      t.cardId,
      t.attemptHash,
    ),
    userCardIdx: index("user_card_ai_analysis_user_card_idx").on(
      t.userId,
      t.cardId,
    ),
    userCreatedIdx: index("user_card_ai_analysis_user_created_idx").on(
      t.userId,
      t.createdAt,
    ),
  }),
);

export type UserCardAiAnalysis = typeof userCardAiAnalysis.$inferSelect;
export type NewUserCardAiAnalysis = typeof userCardAiAnalysis.$inferInsert;
