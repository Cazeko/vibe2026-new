import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { examItems } from "./exam-items";

// 헌법 v3.0 제2조 — 사용자가 풀이 페이지에서 작성한 답안.
// 자가 채점 (FSRS grade) 결과는 user_card_log 와 별도로,
// "내가 시도한 문항"의 답안 자체를 보존하기 위해 분리.
export const userAttempts = pgTable(
  "user_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => examItems.id, { onDelete: "cascade" }),
    answerMd: text("answer_md").notNull(),
    selfGrade: varchar("self_grade", { length: 8 }), // FSRS grade — null 가능 (작성만 하고 채점 안 함)
    attemptedAt: timestamp("attempted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userItemIdx: index("user_attempts_user_item_idx").on(t.userId, t.itemId),
  })
);

export type UserAttempt = typeof userAttempts.$inferSelect;
export type NewUserAttempt = typeof userAttempts.$inferInsert;
