// scripts/seed/post-load.mjs
// 1) regions 17개 시드 (헌법 제15조 정합)
// 2) RLS 정책 적용 (헌법 제28조 정합)
import postgres from "postgres";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const databaseUrl = process.env.DATABASE_URL || (() => {
  const env = readFileSync(join(__dirname, "..", "..", ".env.local"), "utf8");
  return env.match(/^DATABASE_URL=(.+)$/m)?.[1];
})();
if (!databaseUrl) throw new Error("DATABASE_URL not found");

const sql = postgres(databaseUrl, { prepare: false, max: 1 });

// === 1. regions 17개 시드 (헌법 제15조 — 17개 지역 교육청) ===
console.log("=== regions 시드 ===");
const regions = [
  ["SEL", "서울"], ["GGI", "경기"], ["ICN", "인천"], ["BSN", "부산"],
  ["DAE", "대구"], ["GWJ", "광주"], ["DJN", "대전"], ["USN", "울산"],
  ["SEJ", "세종"], ["GWN", "강원"], ["CCB", "충북"], ["CCN", "충남"],
  ["JLB", "전북"], ["JLN", "전남"], ["GSB", "경북"], ["GSN", "경남"],
  ["JJU", "제주"],
];
let regionsInserted = 0;
for (const [code, name] of regions) {
  try {
    await sql`INSERT INTO regions (code, name) VALUES (${code}, ${name}) ON CONFLICT (code) DO NOTHING`;
    regionsInserted++;
  } catch (e) {
    console.log(`  ${code}/${name}: FAIL — ${e.message}`);
  }
}
const regionsCount = (await sql`SELECT count(*)::int AS n FROM regions`)[0].n;
console.log(`  regions: ${regionsCount} rows (시도 ${regionsInserted})`);

// === 2. RLS 정책 (헌법 제28조 정합) ===
console.log("\n=== RLS 정책 적용 ===");

// 사용자 데이터 테이블 (user_id = auth.uid())
const userDataTables = [
  "user_profiles",
  "study_sessions",
  "learning_logs",
  "user_card_state",
  "user_card_log",
  "user_attempts",
  "podcast_progress",
];

// 시드 (공유) — 모든 인증 user 읽기, 쓰기는 service_role만
const sharedReadTables = [
  "exam_papers",
  "exam_items",
  "regions",
];

const rlsStatements = [];

// user_profiles 는 user_id가 PK라 컬럼명이 user_id. 다른 사용자 데이터 테이블도 user_id 컬럼.
for (const t of userDataTables) {
  rlsStatements.push(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY`);
  rlsStatements.push(`DROP POLICY IF EXISTS "${t}_owner_all" ON "${t}"`);
  rlsStatements.push(
    `CREATE POLICY "${t}_owner_all" ON "${t}" FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`
  );
}

// 공유 시드 — 모든 인증 user SELECT만
for (const t of sharedReadTables) {
  rlsStatements.push(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY`);
  rlsStatements.push(`DROP POLICY IF EXISTS "${t}_authenticated_read" ON "${t}"`);
  rlsStatements.push(
    `CREATE POLICY "${t}_authenticated_read" ON "${t}" FOR SELECT TO authenticated USING (true)`
  );
}

// cards — 다형 (user_id IS NULL = 공유, user_id = auth.uid() = 본인)
rlsStatements.push(`ALTER TABLE "cards" ENABLE ROW LEVEL SECURITY`);
rlsStatements.push(`DROP POLICY IF EXISTS "cards_read" ON "cards"`);
rlsStatements.push(
  `CREATE POLICY "cards_read" ON "cards" FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid())`
);
rlsStatements.push(`DROP POLICY IF EXISTS "cards_owner_write" ON "cards"`);
rlsStatements.push(
  `CREATE POLICY "cards_owner_write" ON "cards" FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())`
);
rlsStatements.push(`DROP POLICY IF EXISTS "cards_owner_update" ON "cards"`);
rlsStatements.push(
  `CREATE POLICY "cards_owner_update" ON "cards" FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`
);
rlsStatements.push(`DROP POLICY IF EXISTS "cards_owner_delete" ON "cards"`);
rlsStatements.push(
  `CREATE POLICY "cards_owner_delete" ON "cards" FOR DELETE TO authenticated USING (user_id = auth.uid())`
);

// podcast_episodes — scope='shared' 모든 인증 read, scope='user' 본인만
rlsStatements.push(`ALTER TABLE "podcast_episodes" ENABLE ROW LEVEL SECURITY`);
rlsStatements.push(`DROP POLICY IF EXISTS "podcast_episodes_read" ON "podcast_episodes"`);
rlsStatements.push(
  `CREATE POLICY "podcast_episodes_read" ON "podcast_episodes" FOR SELECT TO authenticated USING (scope = 'shared' OR user_id = auth.uid())`
);
rlsStatements.push(`DROP POLICY IF EXISTS "podcast_episodes_user_write" ON "podcast_episodes"`);
rlsStatements.push(
  `CREATE POLICY "podcast_episodes_user_write" ON "podcast_episodes" FOR INSERT TO authenticated WITH CHECK (scope = 'user' AND user_id = auth.uid())`
);
rlsStatements.push(`DROP POLICY IF EXISTS "podcast_episodes_user_delete" ON "podcast_episodes"`);
rlsStatements.push(
  `CREATE POLICY "podcast_episodes_user_delete" ON "podcast_episodes" FOR DELETE TO authenticated USING (scope = 'user' AND user_id = auth.uid())`
);

let ok = 0;
let fail = 0;
for (const stmt of rlsStatements) {
  try {
    await sql.unsafe(stmt);
    ok++;
  } catch (e) {
    fail++;
    console.log(`  FAIL: ${stmt.substring(0, 80)}... → ${e.message.split("\n")[0]}`);
  }
}
console.log(`  RLS statements: ${ok} ok, ${fail} fail`);

// === 검증 ===
console.log("\n=== RLS 검증 ===");
const rlsStatus = await sql`
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('user_profiles','study_sessions','learning_logs',
                      'user_card_state','user_card_log','user_attempts','podcast_progress',
                      'exam_papers','exam_items','regions','cards','podcast_episodes')
  ORDER BY tablename
`;
for (const r of rlsStatus) {
  console.log(`  ${r.tablename.padEnd(20)}: RLS=${r.rowsecurity ? "ON" : "OFF"}`);
}

const policiesByTable = await sql`
  SELECT tablename, count(*)::int AS n
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
  ORDER BY tablename
`;
console.log("\n--- 정책 수 ---");
for (const r of policiesByTable) {
  console.log(`  ${r.tablename.padEnd(20)}: ${r.n} policies`);
}

await sql.end();
console.log("\n✅ post-load 완료");
