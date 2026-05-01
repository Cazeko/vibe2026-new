import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  varchar,
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Mistake = typeof mistakes.$inferSelect;
export type NewMistake = typeof mistakes.$inferInsert;
