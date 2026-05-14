import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { cards } from "./cards";

// 헌법 v3.5.1 제16조 — 사용자 커스텀 해시태그. 카드 메타 인터랙션 다듬기
// (시행규칙 32 제34조). 카드당 다중 태그, 사용자별 격리 (RLS 본인만).
//
// 정규화 — tag 는 application layer 에서 # 접두어 제거 + trim + 공백→하이픈
// 처리 후 저장한다 (actions.normalizeTag 참조).
//
// 상한 — 카드당 12개 (application layer enforce). DB 레벨은 unique 만.
export const userCardTags = pgTable(
  "user_card_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    tag: varchar("tag", { length: 32 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userCardTagUq: uniqueIndex("user_card_tags_user_card_tag_uq").on(
      t.userId,
      t.cardId,
      t.tag,
    ),
    userCardIdx: index("user_card_tags_user_card_idx").on(t.userId, t.cardId),
    userTagIdx: index("user_card_tags_user_tag_idx").on(t.userId, t.tag),
  }),
);

export type UserCardTag = typeof userCardTags.$inferSelect;
export type NewUserCardTag = typeof userCardTags.$inferInsert;
