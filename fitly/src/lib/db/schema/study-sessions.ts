import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

// 2026-05-17 — 마이그레이션 0002 정합. (user_id, started_at DESC) 복합 인덱스로
// KPI/heatmap/sessionStats/recentActivity/trend/weekly minutes 등 7개 hot 쿼리의
// 풀스캔을 index seek 로 전환.
export const studySessions = pgTable(
  "study_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    mode: varchar("mode", { length: 16 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    cardsReviewed: integer("cards_reviewed").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    totalCount: integer("total_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userStartedIdx: index("study_sessions_user_started_idx").on(
      t.userId,
      t.startedAt,
    ),
  }),
);

export type StudySession = typeof studySessions.$inferSelect;
export type NewStudySession = typeof studySessions.$inferInsert;
