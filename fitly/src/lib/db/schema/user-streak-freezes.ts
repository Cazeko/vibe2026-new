import {
  pgTable,
  uuid,
  date,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// 헌법 v3.5.1 제16조 — 잔디(Streak) 얼리기. 기존 streak 계산 시스템의 보강
// (시행규칙 32 제34조). frozen_date 는 dateSet 에 union 되어 학습일로 인정된다.
//
// 상한 — 30일 윈도우 내 2개 (application layer enforce). DB 레벨은 unique 만.
// 듀오링고 차용 retention 장치 — 한 달에 1~2회 사용 가능.
export const userStreakFreezes = pgTable(
  "user_streak_freezes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    frozenDate: date("frozen_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userDateUq: uniqueIndex("user_streak_freezes_user_date_uq").on(
      t.userId,
      t.frozenDate,
    ),
    userDateIdx: index("user_streak_freezes_user_date_idx").on(
      t.userId,
      t.frozenDate,
    ),
  }),
);

export type UserStreakFreeze = typeof userStreakFreezes.$inferSelect;
export type NewUserStreakFreeze = typeof userStreakFreezes.$inferInsert;
