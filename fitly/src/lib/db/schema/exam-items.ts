import {
  pgTable,
  uuid,
  integer,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { examPapers } from "./exam-papers";

// 헌법 v3.0 제13조의2 — 시드 문항 (시험지에서 분리된 개별 문항).
// 본 테이블도 모든 사용자에게 공유 (user_id 없음).
export const examItems = pgTable(
  "exam_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paperId: uuid("paper_id")
      .notNull()
      .references(() => examPapers.id, { onDelete: "cascade" }),
    itemNo: integer("item_no").notNull(),
    stemMd: text("stem_md").notNull(), // 문제 본문 (Markdown, 하위 발문 「가/나/다」 보존)
    points: integer("points"),
    format: varchar("format", { length: 16 }), // '객관식' | '단답형' | '서술형' | '논술형'
    domains: jsonb("domains").$type<string[]>().notNull().default([]), // 11과목 + 교육학
    bloom: varchar("bloom", { length: 8 }), // '기억' | '이해' | '적용' | '분석' | '평가' | '창작'
    keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
    answerKeyMd: text("answer_key_md"), // AI 생성 모범답안 (서술형만)
    verified: boolean("verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    paperItemUq: uniqueIndex("exam_items_paper_item_uq").on(
      t.paperId,
      t.itemNo
    ),
    formatIdx: index("exam_items_format_idx").on(t.format),
  })
);

export type ExamItem = typeof examItems.$inferSelect;
export type NewExamItem = typeof examItems.$inferInsert;
