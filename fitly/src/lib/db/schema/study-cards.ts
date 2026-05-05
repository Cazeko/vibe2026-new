import {
  pgTable,
  uuid,
  text,
  jsonb,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

// 헌법 v1.11 제13조의2 — StudyCard 정식 테이블 (RAG/PDF 추출 학습 카드).
export const studyCards = pgTable("study_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  materialId: uuid("material_id"),
  question: text("question").notNull(),
  choices: jsonb("choices").$type<string[] | null>(),
  answer: text("answer"),
  explanation: text("explanation"),
  keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
  questionType: varchar("question_type", { length: 24 }),
  answerSource: varchar("answer_source", { length: 24 })
    .notNull()
    .default("ai_estimate"),
  srsState: jsonb("srs_state").$type<import("@/types").SrsState | null>(),
  dueAt: timestamp("due_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  reviewCount: integer("review_count").notNull().default(0),
  lapseCount: integer("lapse_count").notNull().default(0),
  lastGrade: varchar("last_grade", { length: 8 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type StudyCard = typeof studyCards.$inferSelect;
export type NewStudyCard = typeof studyCards.$inferInsert;
