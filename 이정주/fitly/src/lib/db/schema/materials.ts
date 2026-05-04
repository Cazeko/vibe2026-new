import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  storagePath: text("storage_path"),
  mimeType: varchar("mime_type", { length: 64 }),
  sizeBytes: integer("size_bytes"),
  pages: integer("pages"),
  status: varchar("status", { length: 16 }).notNull().default("uploaded"),
  source: varchar("source", { length: 16 }).notNull().default("upload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Material = typeof materials.$inferSelect;
export type NewMaterial = typeof materials.$inferInsert;
