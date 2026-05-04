import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  varchar,
  integer,
} from "drizzle-orm/pg-core";

export const mistakes = pgTable("mistakes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  question: text("question").notNull(),
  choices: jsonb("choices").$type<string[] | null>(),
  answer: text("answer"),
  explanation: text("explanation"),
  keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
  source: varchar("source", { length: 24 }).notNull().default("upload"),
  answerSource: varchar("answer_source", { length: 24 })
    .notNull()
    .default("ai_estimate"),
  questionType: varchar("question_type", { length: 24 }),
  srsState: jsonb("srs_state").$type<import("@/types").SrsState | null>(),
  dueAt: timestamp("due_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  reviewCount: integer("review_count").notNull().default(0),
  lapseCount: integer("lapse_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Mistake = typeof mistakes.$inferSelect;
export type NewMistake = typeof mistakes.$inferInsert;
