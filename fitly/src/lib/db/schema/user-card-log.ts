import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { cards } from "./cards";

// 헌법 v3.0 제13조의2 6항 — 사용자별 등급 이력 (append-only).
// 최신 상태는 user_card_state 에 별도로 보존되어 즉시 조회 가능.
export const userCardLog = pgTable(
  "user_card_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    grade: varchar("grade", { length: 8 }).notNull(), // 'again' | 'hard' | 'good' | 'easy'
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userCardTimeIdx: index("user_card_log_user_card_time_idx").on(
      t.userId,
      t.cardId,
      t.reviewedAt
    ),
    // 2026-05-17 — 마이그레이션 0002 정합. computeWeakTypes 의 60d window
    // 쿼리는 user_id + reviewed_at range scan 이라 (user_id, card_id, reviewed_at)
    // 인덱스는 card_id 가 prefix 중간이라 비효율. (user_id, reviewed_at) 단독
    // 인덱스로 range scan 정합.
    userTimeIdx: index("user_card_log_user_time_idx").on(
      t.userId,
      t.reviewedAt,
    ),
  })
);

export type UserCardLog = typeof userCardLog.$inferSelect;
export type NewUserCardLog = typeof userCardLog.$inferInsert;
