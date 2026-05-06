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

// 헌법 v3.3 제13조의2 — 시드 문항 (시험지에서 분리된 개별 문항).
// 본 테이블도 모든 사용자에게 공유 (user_id 없음).
//
// 본문 정확성 정책 (v3.3 9항):
// - stemText: unpdf 라이브러리로 PDF 텍스트 레이어 직접 추출 (벡터 PDF의
//   텍스트 객체를 OCR 없이 읽음). LLM 생성 X. 사용자 검색·접근성·복사용.
// - stemImagePath: pdftocairo로 추출한 PDF 페이지 PNG 경로. 사용자 화면
//   본문 (표·도식·수식·빈칸 ㉠ 등 시험지 시각 그대로).
// - LLM은 본문(stem)을 생성하지 아니하며, 분석·태깅·답안만 생성한다.
//
// 검증 분리:
// - verifiedText: PDF 원본 직접 사용 시 자동 true (운영자 변경 권한 없음)
// - verifiedAnswer: answer_key_md 운영자 검수 후 true (기본 false)
export const examItems = pgTable(
  "exam_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paperId: uuid("paper_id")
      .notNull()
      .references(() => examPapers.id, { onDelete: "cascade" }),
    itemNo: integer("item_no").notNull(),
    // 본문 (PDF 원본 직접) — v3.3
    stemText: text("stem_text").notNull(), // unpdf 추출 본문 (검색·낭독·복사용)
    stemImagePath: text("stem_image_path"), // pdftocairo PNG 경로 (사용자 화면 본문)
    // 분석·태깅 (LLM 생성)
    points: integer("points"),
    format: varchar("format", { length: 16 }), // '객관식' | '단답형' | '서술형' | '논술형'
    domains: jsonb("domains").$type<string[]>().notNull().default([]), // 11과목 + 교육학
    bloom: varchar("bloom", { length: 8 }), // '기억' | '이해' | '적용' | '분석' | '평가' | '창작'
    keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
    // 답안·해설 (LLM 생성, 분리 — v3.2 답안 vs 해설)
    answerMd: text("answer_md"), // 학생이 시험에서 쓸 분량 (단답 한 문장 / 서술 2~4문장 / 논술 2매)
    explanationMd: text("explanation_md"), // 학습 보조 해설 (왜 그게 답인지)
    // 검증 — v3.3 분리
    verifiedText: boolean("verified_text").notNull().default(true), // PDF 직접 → 기본 true
    verifiedAnswer: boolean("verified_answer").notNull().default(false), // LLM 생성 → 기본 false
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
