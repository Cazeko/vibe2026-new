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
    max: 8,             // Pooler free(15) 한도 안 — /me 페이지 동시 query ~10개 대응 (cache dedupe 후 7~8)
    idle_timeout: 20,   // 20초 유휴 연결 자동 종료
    max_lifetime: 60 * 5, // 5분 후 강제 갱신
    connect_timeout: 10,  // 10초 안에 connect 못 하면 즉시 throw
    connection: {
      // 헌법 제37조 + v3.5 제35조의2 정합 — query가 8초 넘어가면 cancel.
      // SSR이 Vercel function timeout에 걸려 무한 hang하는 패턴 방지.
      // safeRun이 PostgresError 57014를 catch하여 fallback 처리.
      statement_timeout: 8000,
    },
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
