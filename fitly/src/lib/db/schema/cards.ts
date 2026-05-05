import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { examItems } from "./exam-items";

// 헌법 v3.0 제13조의2 — 학습 카드 (다형 단일 테이블).
// type='quiz'/'keyword' = 시드에서 자동 파생, user_id NULL (모든 사용자에게 공유).
// type='mistake' = 사용자별, 풀이의 again/hard 자동 합류.
//
// FSRS 상태는 user_card_state 테이블로 분리 (1 row per user × card).
// 본 테이블의 본문은 사용자별로 변하지 않음.
export const cards = pgTable(
  "cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: varchar("type", { length: 16 }).notNull(), // 'quiz' | 'keyword' | 'mistake'
    sourceItemId: uuid("source_item_id").references(() => examItems.id, {
      onDelete: "cascade",
    }),
    userId: uuid("user_id"), // NULL for shared seed cards
    frontMd: text("front_md").notNull(),
    backMd: text("back_md"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    // 시드 재실행 시 중복 차단 (Appendix A #3).
    // user_id가 NULL인 shared 시드와 NOT NULL인 사용자 카드를 분리 unique.
    sharedSeedUq: uniqueIndex("cards_shared_seed_uq")
      .on(t.sourceItemId, t.type)
      .where(sql`${t.userId} IS NULL`),
    userOwnedUq: uniqueIndex("cards_user_owned_uq")
      .on(t.sourceItemId, t.type, t.userId)
      .where(sql`${t.userId} IS NOT NULL`),
    userTypeIdx: index("cards_user_type_idx").on(t.userId, t.type),
  })
);

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
