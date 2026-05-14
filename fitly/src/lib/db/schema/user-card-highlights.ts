import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { cards } from "./cards";

// 헌법 v3.5.1 제16조 — 사용자 형광펜/밑줄. 카드 본문 인터랙션 다듬기로 분류 (시행규칙 32 제34조).
//
// anchor 전략 — quote + prefix + suffix.
//   - marker offset 은 마크다운 sanitize(ZWSP 삽입)로 불안정 → 미채택.
//   - prefix(≤20자)·suffix(≤20자) 컨텍스트로 unique match 보장.
//
// surface — 동일 카드 내 어느 영역(back_md/front_text)에 표시할지 분리.
//
// color — yellow/green/pink/underline 4종. DESIGN.md §4.3 evergreen 6 사용처 보호.
//   markdown.tsx 의 strong 형광펜(gold-soft) 과 색 분리.
export const userCardHighlights = pgTable(
  "user_card_highlights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    surface: varchar("surface", { length: 16 })
      .$type<"back_md" | "front_text">()
      .notNull(),
    quote: text("quote").notNull(),
    prefix: text("prefix").notNull().default(""),
    suffix: text("suffix").notNull().default(""),
    color: varchar("color", { length: 16 })
      .$type<"yellow" | "green" | "pink" | "underline">()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userCardIdx: index("user_card_highlights_user_card_idx").on(
      t.userId,
      t.cardId,
    ),
    userCreatedIdx: index("user_card_highlights_created_idx").on(
      t.userId,
      t.createdAt,
    ),
  }),
);

export type UserCardHighlight = typeof userCardHighlights.$inferSelect;
export type NewUserCardHighlight = typeof userCardHighlights.$inferInsert;
