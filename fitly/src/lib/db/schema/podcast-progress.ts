import {
  pgTable,
  uuid,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { podcastEpisodes } from "./podcast-episodes";

// 헌법 v3.0 제13조의3 4항 — 청취 진척 (재개 가능).
export const podcastProgress = pgTable(
  "podcast_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    episodeId: uuid("episode_id")
      .notNull()
      .references(() => podcastEpisodes.id, { onDelete: "cascade" }),
    currentSec: integer("current_sec").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userEpisodeUq: uniqueIndex("podcast_progress_user_episode_uq").on(
      t.userId,
      t.episodeId
    ),
  })
);

export type PodcastProgress = typeof podcastProgress.$inferSelect;
export type NewPodcastProgress = typeof podcastProgress.$inferInsert;
