import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  targetSchoolIds: integer("target_school_ids").array(),
  examDates: jsonb("exam_dates").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
