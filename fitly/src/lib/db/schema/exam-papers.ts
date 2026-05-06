import {
  pgTable,
  uuid,
  integer,
  text,
  varchar,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// 헌법 v3.0 제13조의2 — 시드 시험지 (KICE 공식 공개 기출).
// 본 테이블은 모든 사용자에게 공유되며 (user_id 없음), 운영자 1회 시드 + 매년 갱신.
export const examPapers = pgTable(
  "exam_papers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    year: integer("year").notNull(),
    session: varchar("session", { length: 12 }).notNull(), // 'essay' | 'A' | 'B' | 'combined' (헌법 v3.1 + kice_pdfs/ README 정합)
    pdfPath: text("pdf_path").notNull(), // kice_pdfs/ 내 상대 경로
    sourceUrl: text("source_url"), // KICE 다운로드 URL (있으면)
    verified: boolean("verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    yearSessionUq: uniqueIndex("exam_papers_year_session_uq").on(
      t.year,
      t.session
    ),
  })
);

export type ExamPaper = typeof examPapers.$inferSelect;
export type NewExamPaper = typeof examPapers.$inferInsert;
