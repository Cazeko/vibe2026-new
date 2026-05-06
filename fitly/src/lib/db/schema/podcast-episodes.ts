import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  jsonb,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

// 헌법 v3.0 제13조의3 — NotebookLM 스타일 자동 생성 팟캐스트.
// scope='shared' = 시드 영역×연도·주제 단위 자동 생성, 모든 사용자에게 공유.
// scope='user'   = 사용자가 자기 약점 영역·자료를 선택해 즉석 생성, 본인만 청취.
export const podcastEpisodes = pgTable(
  "podcast_episodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scope: varchar("scope", { length: 8 }).notNull(), // 'shared' | 'user'
    userId: uuid("user_id"), // shared면 NULL
    theme: text("theme").notNull(), // ex: "2024 교직논술 / 2022 개정 교육과정"
    scriptJson: jsonb("script_json").$type<unknown>(), // multi-speaker dialogue
    audioUrl: text("audio_url"),
    durationSec: integer("duration_sec"),
    verified: boolean("verified").notNull().default(false),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    scopeUserIdx: index("podcast_episodes_scope_user_idx").on(
      t.scope,
      t.userId
    ),
  })
);

export type PodcastEpisode = typeof podcastEpisodes.$inferSelect;
export type NewPodcastEpisode = typeof podcastEpisodes.$inferInsert;
