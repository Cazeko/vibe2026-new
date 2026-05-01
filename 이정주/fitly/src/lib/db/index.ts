import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

let cached: ReturnType<typeof createDb> | null = null;

function createDb() {
  const client = postgres(env.database.url, { prepare: false });
  return drizzle(client, { schema });
}

export function getDb() {
  if (!cached) cached = createDb();
  return cached;
}

export type DB = ReturnType<typeof createDb>;
