import {
  pgTable,
  uuid,
  jsonb,
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
  })
);

export type UserCardState = typeof userCardState.$inferSelect;
export type NewUserCardState = typeof userCardState.$inferInsert;
