import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { cards } from "./cards";

// 헌법 시행규칙 33 제35조 백업 — 사용자 AI 답안 신고 채널 (코드리뷰 C.H2, 2026-05-15).
// AI 모범답안·해설의 오류를 학습자가 즉시 보고할 수 있게 하여 정직성 §3의2 보강.

export type CardReportCategory =
  | "answer_wrong"
  | "explanation_unclear"
  | "irrelevant"
  | "other";

export type CardReportStatus = "pending" | "reviewed" | "dismissed";

export const cardReports = pgTable(
  "card_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    category: varchar("category", { length: 32 })
      .$type<CardReportCategory>()
      .notNull(),
    detail: text("detail"),
    status: varchar("status", { length: 16 })
      .$type<CardReportStatus>()
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by"),
  },
  (t) => ({
    cardIdx: index("card_reports_card_idx").on(t.cardId),
    statusCreatedIdx: index("card_reports_status_created_idx").on(
      t.status,
      t.createdAt,
    ),
    userIdx: index("card_reports_user_idx").on(t.userId, t.createdAt),
  }),
);

export type CardReport = typeof cardReports.$inferSelect;
export type NewCardReport = typeof cardReports.$inferInsert;
