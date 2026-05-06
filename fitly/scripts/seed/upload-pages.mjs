// scripts/seed/upload-pages.mjs
// 헌법 v3.3 제13조의2 9항 + v3.5 제35조의2 정합 — stem_image_path PNG를
// Supabase Storage `exam-pages` 버킷에 업로드 + DB 경로 storage path로 갱신.
//
// 사전 조건:
//   1. supabase/migrations/0009_exam_pages_storage.sql 적용 (버킷 등록)
//   2. .env.local 또는 환경변수에 NEXT_PUBLIC_SUPABASE_URL,
//      SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL 설정
//   3. scripts/seed/data/papers/{year-session}/pages/*.png 존재 (이미 추출됨)
//
// 사용:
//   node scripts/seed/upload-pages.mjs              # 본실행 (모든 PDF)
//   node scripts/seed/upload-pages.mjs --dry-run    # 업로드 안 하고 카운트만
//   node scripts/seed/upload-pages.mjs --year 2024  # 특정 학년도만
//
// 결과:
//   - storage path 형태: `{year}-{session}/page-NN.png` (버킷명 제외)
//   - exam_items.stem_image_path: 로컬 경로 → storage path
//   - cards.front_image_path: 로컬 경로 → storage path

import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const papersBase = join(__dirname, "data", "papers");
const BUCKET = "exam-pages";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const YEAR_FILTER = (() => {
  const idx = args.indexOf("--year");
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
})();

function loadEnvLocal() {
  const path = join(__dirname, "..", "..", ".env.local");
  if (!existsSync(path)) return {};
  const env = readFileSync(path, "utf8");
  const result = {};
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) result[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return result;
}

const envFile = loadEnvLocal();
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || envFile.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY || envFile.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL || envFile.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 누락 (.env.local 확인)",
  );
}
if (!DATABASE_URL) throw new Error("DATABASE_URL 누락 (.env.local 확인)");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const sql = postgres(DATABASE_URL, { prepare: false, max: 1 });

// 버킷 자동 생성 (없을 때만) — SQL Editor의 postgres role은 storage.buckets·
// storage.objects의 owner가 아니라 INSERT/CREATE POLICY 거부(42501).
// service_role 키 + Storage REST API는 권한 우회 가능.
async function ensureBucket() {
  const { data: list, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    throw new Error(`listBuckets failed: ${listErr.message}`);
  }
  const exists = list?.some((b) => b.id === BUCKET);
  if (exists) {
    console.log(`[setup] bucket already exists: ${BUCKET}`);
    return;
  }
  if (DRY_RUN) {
    console.log(`[setup][dry-run] would create bucket: ${BUCKET}`);
    return;
  }
  console.log(`[setup] creating bucket: ${BUCKET} (public=true, 10MB limit)`);
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10485760,
    allowedMimeTypes: ["image/png", "image/webp", "image/jpeg"],
  });
  if (createErr) {
    throw new Error(`createBucket failed: ${createErr.message}`);
  }
  console.log(`[setup] bucket created.`);
}

await ensureBucket();

const dirs = readdirSync(papersBase)
  .filter((d) => /^\d{4}-/.test(d))
  .filter((d) => statSync(join(papersBase, d)).isDirectory())
  .filter((d) => !YEAR_FILTER || d.startsWith(YEAR_FILTER))
  .sort();

console.log(
  `=== upload-pages.mjs ${DRY_RUN ? "[DRY-RUN] " : ""}${YEAR_FILTER ? `(year=${YEAR_FILTER}) ` : ""}===`,
);
console.log(`Target dirs: ${dirs.length}`);

let uploaded = 0;
let skipped = 0;
const errors = [];

for (const dir of dirs) {
  const pagesDir = join(papersBase, dir, "pages");
  if (!existsSync(pagesDir)) {
    console.log(`[skip] ${dir} — no pages/`);
    continue;
  }
  const pngs = readdirSync(pagesDir)
    .filter((f) => f.endsWith(".png"))
    .sort();
  for (const png of pngs) {
    const remotePath = `${dir}/${png}`;
    if (DRY_RUN) {
      uploaded += 1;
      continue;
    }
    const localPath = join(pagesDir, png);
    const buf = readFileSync(localPath);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(remotePath, buf, {
        contentType: "image/png",
        upsert: true,
      });
    if (error) {
      errors.push({ file: remotePath, error: error.message });
      console.error(`[err] ${remotePath}: ${error.message}`);
      continue;
    }
    uploaded += 1;
    if (uploaded % 50 === 0) {
      console.log(`[progress] ${uploaded} files uploaded...`);
    }
  }
}

console.log(
  `\n=== upload phase: ${uploaded} files ${DRY_RUN ? "(would upload)" : "uploaded"}, ${errors.length} errors ===`,
);

if (errors.length > 0) {
  console.error("\nErrors:");
  for (const e of errors.slice(0, 10)) {
    console.error(`  - ${e.file}: ${e.error}`);
  }
  if (errors.length > 10) console.error(`  ... and ${errors.length - 10} more`);
}

// DB 경로 갱신 — 로컬 경로 → storage path
// 기존: "scripts/seed/data/papers/{year-session}/pages/page-NN.png"
// 변환: "{year-session}/page-NN.png"
if (!DRY_RUN) {
  console.log(
    `\n=== updating DB paths (exam_items.stem_image_path, cards.front_image_path) ===`,
  );

  // postgres-js의 sql 태그가 backslash backreference를 parameter로 오인식해
  // regexp_replace 대신 단순 replace 두 번으로 prefix·중간 디렉토리 제거.
  // "scripts/seed/data/papers/2024-essay/pages/page-01.png"
  //   → "2024-essay/page-01.png"
  const oldPrefix = "scripts/seed/data/papers/";
  const examItemsRows = await sql`
    UPDATE exam_items
    SET stem_image_path = replace(
      replace(stem_image_path, 'scripts/seed/data/papers/', ''),
      '/pages/',
      '/'
    )
    WHERE stem_image_path LIKE ${oldPrefix + "%"}
    RETURNING id
  `;
  console.log(`exam_items.stem_image_path updated: ${examItemsRows.count}`);

  const cardsRows = await sql`
    UPDATE cards
    SET front_image_path = replace(
      replace(front_image_path, 'scripts/seed/data/papers/', ''),
      '/pages/',
      '/'
    )
    WHERE front_image_path LIKE ${oldPrefix + "%"}
    RETURNING id
  `;
  console.log(`cards.front_image_path updated: ${cardsRows.count}`);
} else {
  console.log("\n[dry-run] DB path 갱신 skip");
}

await sql.end();
process.exit(errors.length > 0 ? 1 : 0);
