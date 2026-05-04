import {
  pgTable,
  uuid,
  date,
  numeric,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const learningLogs = pgTable(
  "learning_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    logDate: date("log_date").notNull(),
    fitScore: numeric("fit_score", { precision: 5, scale: 2 }),
    accuracy: numeric("accuracy", { precision: 5, scale: 2 }),
    studyMinutes: integer("study_minutes").notNull().default(0),
    cardsReviewed: integer("cards_reviewed").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userDateUnique: unique("learning_logs_user_log_date_unique").on(
      t.userId,
      t.logDate,
    ),
  }),
);

export type LearningLog = typeof learningLogs.$inferSelect;
export type NewLearningLog = typeof learningLogs.$inferInsert;
