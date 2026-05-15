import {
  pgTable,
  uuid,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { cards } from "./cards";

// 헌법 v3.0 제13조의2 6항 — 시드 카드는 모든 사용자가 동일한 본문을 보지만,
// FSRS 상태와 등급 로그는 사용자별로 분리된다.
//
// 본 테이블은 (user_id, card_id) 1:1 — 즉시 조회용 최신 상태.
// 등급 이력은 user_card_log 에 append-only 로 별도 보존.
//
// 백승환 #9 (2026-05-15) — `mark` 컬럼 신설.
// 사용자가 카드별로 빠른 표식(북마크 / 별표 / 모르겠음) 을 1개 부여한다.
// user_card_tags 와 별개 — 마크는 카드당 1개 토글, 트랙 필터 1순위 데이터.
// 빈 값(null)은 미마킹. enum 은 application layer 에서 강제 (CARD_MARK_KINDS).
export const CARD_MARK_KINDS = ["bookmark", "star", "unsure"] as const;
export type CardMarkKind = (typeof CARD_MARK_KINDS)[number];

export const userCardState = pgTable(
  "user_card_state",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    fsrsState: jsonb("fsrs_state")
      .$type<import("@/types").SrsState>()
      .notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    mark: text("mark").$type<CardMarkKind | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userCardUq: uniqueIndex("user_card_state_user_card_uq").on(
      t.userId,
      t.cardId
    ),
    userDueIdx: index("user_card_state_user_due_idx").on(t.userId, t.dueAt),
    userMarkIdx: index("user_card_state_user_mark_idx").on(t.userId, t.mark),
  })
);

export type UserCardState = typeof userCardState.$inferSelect;
export type NewUserCardState = typeof userCardState.$inferInsert;
