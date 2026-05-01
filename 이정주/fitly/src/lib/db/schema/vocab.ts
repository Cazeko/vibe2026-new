import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  varchar,
  integer,
} from "drizzle-orm/pg-core";

export const vocabCards = pgTable("vocab_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  example: text("example"),
  level: varchar("level", { length: 16 }),
  source: varchar("source", { length: 24 }).notNull().default("vocab_seed"),
  srsState: jsonb("srs_state").$type<import("@/types").SrsState | null>(),
  dueAt: timestamp("due_at", { withTimezone: true }).defaultNow().notNull(),
  reviewCount: integer("review_count").notNull().default(0),
  lapseCount: integer("lapse_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type VocabCardRow = typeof vocabCards.$inferSelect;
export type NewVocabCard = typeof vocabCards.$inferInsert;
