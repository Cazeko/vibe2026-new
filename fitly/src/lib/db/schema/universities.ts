import {
  pgTable,
  serial,
  text,
  date,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

export const universities = pgTable("universities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  examDate: date("exam_date"),
  weights: jsonb("weights").$type<{
    vocab: number;
    grammar: number;
    reading: number;
  }>(),
  cutoffs: jsonb("cutoffs").$type<{
    vocab_cut: number;
    vocab_avg: number;
    grammar_cut: number;
    grammar_avg: number;
    reading_cut: number;
    reading_avg: number;
  }>(),
  totalQuestions: integer("total_questions").default(0).notNull(),
});

export type University = typeof universities.$inferSelect;
export type NewUniversity = typeof universities.$inferInsert;
