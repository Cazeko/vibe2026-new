import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

// HMR 환경에서 모듈이 여러 번 평가돼도 동일 클라이언트를 재사용하도록 globalThis 캐시.
// Supabase 세션 모드 풀러(포트 5432)는 무료 티어에서 15 client 제한이 있어
// dev 서버에서 누수되면 EMAXCONNSESSION 에러가 발생한다.
const globalForDb = globalThis as unknown as {
  __fitlyPg?: ReturnType<typeof postgres>;
  __fitlyDb?: ReturnType<typeof drizzleFromClient>;
};

function drizzleFromClient(client: ReturnType<typeof postgres>) {
  return drizzle(client, { schema });
}

function createPgClient() {
  return postgres(env.database.url, {
    prepare: false,
    max: 3,             // dev/serverless 친화 — 풀러 한도 보호
    idle_timeout: 20,   // 20초 유휴 연결 자동 종료
    max_lifetime: 60 * 5, // 5분 후 강제 갱신
  });
}

export function getDb() {
  if (!globalForDb.__fitlyDb) {
    globalForDb.__fitlyPg = createPgClient();
    globalForDb.__fitlyDb = drizzleFromClient(globalForDb.__fitlyPg);
  }
  return globalForDb.__fitlyDb;
}

export type DB = ReturnType<typeof drizzleFromClient>;
