// scripts/seed/load-db.mjs
// items.json (60 papers) + keywords.json → DB 적재
// 헌법 v3.3 정합: stem_text는 unpdf 슬라이스, verified_text/verified_answer 분리
import postgres from "postgres";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const papersBase = join(__dirname, "data", "papers");
const keywordsPath = join(__dirname, "data", "keywords.json");

const databaseUrl = process.env.DATABASE_URL || (() => {
  const env = readFileSync(join(__dirname, "..", "..", ".env.local"), "utf8");
  return env.match(/^DATABASE_URL=(.+)$/m)?.[1];
})();
if (!databaseUrl) throw new Error("DATABASE_URL not found");

const sql = postgres(databaseUrl, { prepare: false, max: 1 });

// session 한국어 → 영문 매핑 (스키마 정합 — 'essay'|'A'|'B'|'combined')
function normalizeSession(s) {
  if (!s) return "unknown";
  if (s === "essay" || s === "A" || s === "B" || s === "combined") return s;
  if (s.includes("논술")) return "essay";
  if (s.includes("통합본") || s === "combined") return "combined";
  if (/교육과정\s*A/.test(s)) return "A";
  if (/교육과정\s*B/.test(s)) return "B";
  return s.length <= 12 ? s : "unknown";
}

const dirs = readdirSync(papersBase).filter((d) => /^\d{4}-/.test(d)).sort();

let papers_inserted = 0;
let items_inserted = 0;
let cards_quiz_inserted = 0;
let cards_keyword_inserted = 0;
const errors = [];

// 코드리뷰 M6 (2026-05-15) — 헌법 제18조의3 5항: 2002 학년도 이전 PDF 는
// 폰트 손상으로 한국어 본문이 거의 손실되어 시드 대상에서 제외한다.
const MIN_SEED_YEAR = 2002;
const skipped_pre2002 = [];

for (const dir of dirs) {
  const itemsPath = join(papersBase, dir, "items.json");
  if (!existsSync(itemsPath)) continue;
  const data = JSON.parse(readFileSync(itemsPath, "utf8"));
  if (!data.paper || !data.items) {
    errors.push(`${dir}: paper/items 누락`);
    continue;
  }
  const paper = data.paper;
  if (typeof paper.year !== "number" || paper.year < MIN_SEED_YEAR) {
    skipped_pre2002.push(dir);
    continue;
  }
  const session = normalizeSession(paper.session);
  const pdfPath = `kice_pdfs/${dir}.pdf`;

  try {
    const [paperRow] = await sql`
      INSERT INTO exam_papers (year, session, pdf_path, source_url, verified)
      VALUES (${paper.year}, ${session}, ${pdfPath}, ${null}, ${false})
      RETURNING id
    `;
    papers_inserted++;

    for (const item of data.items) {
      // 0017 (2026-05-14) — 한 문항이 여러 PDF 페이지에 걸친 경우 모든 페이지
      // 경로를 jsonb 배열로 보존. 단일 stem_image_path 는 호환성 유지용 첫 페이지.
      const stemImagePaths =
        item.stem_image_paths && item.stem_image_paths.length > 0
          ? item.stem_image_paths.map(
              (p) => `scripts/seed/data/papers/${dir}/${p}`,
            )
          : [];
      const stemImagePath = stemImagePaths[0] ?? null;

      const verifiedText = item.verified_text === false ? false : true;
      const verifiedAnswer = item.verified_answer === true;

      const [itemRow] = await sql`
        INSERT INTO exam_items (
          paper_id, item_no, stem_text, stem_image_path, stem_image_paths,
          points, format,
          domains, bloom, keywords, answer_md, explanation_md,
          verified_text, verified_answer
        )
        VALUES (
          ${paperRow.id}, ${item.item_no}, ${item.stem_text || ""}, ${stemImagePath},
          ${JSON.stringify(stemImagePaths)}::jsonb,
          ${item.points != null ? Math.round(item.points) : null}, ${item.format ?? null},
          ${JSON.stringify(item.domains || [])}::jsonb,
          ${item.bloom ?? null},
          ${JSON.stringify(item.keywords || [])}::jsonb,
          ${item.answer_md ?? null}, ${item.explanation_md ?? null},
          ${verifiedText}, ${verifiedAnswer}
        )
        RETURNING id
      `;
      items_inserted++;

      if (!item.skip_quiz_card) {
        const backMd =
          (item.answer_md || "") +
          (item.explanation_md
            ? "\n\n---\n\n## 학습 보조 해설\n\n" + item.explanation_md
            : "");
        await sql`
          INSERT INTO cards (
            type, source_item_id, user_id, front_text, front_image_path,
            front_image_paths,
            back_md, verified_text, verified_answer
          )
          VALUES (
            'quiz', ${itemRow.id}, ${null},
            ${item.stem_text || ""}, ${stemImagePath},
            ${JSON.stringify(stemImagePaths)}::jsonb,
            ${backMd}, ${verifiedText}, ${verifiedAnswer}
          )
        `;
        cards_quiz_inserted++;
      }
    }
    console.log(
      `${dir}: paper ✓ + ${data.items.length} items + ${data.items.filter((i) => !i.skip_quiz_card).length} quiz cards`
    );
  } catch (e) {
    errors.push(`${dir}: ${e.message}`);
    console.log(`${dir}: FAIL — ${e.message}`);
  }
}

console.log("--- 키워드 카드 적재 ---");
if (existsSync(keywordsPath)) {
  const kwData = JSON.parse(readFileSync(keywordsPath, "utf8"));
  for (const kw of kwData.keywords || []) {
    if (kw.concept_note_md) {
      try {
        await sql`
          INSERT INTO cards (
            type, source_item_id, user_id, front_text, front_image_path, back_md,
            verified_text, verified_answer
          )
          VALUES (
            'keyword', ${null}, ${null},
            ${"## 키워드: " + kw.keyword}, ${null}, ${kw.concept_note_md},
            ${false}, ${false}
          )
        `;
        cards_keyword_inserted++;
      } catch (e) {
        errors.push(`keyword ${kw.keyword}: ${e.message}`);
      }
    }
  }
}

console.log("\n=== 적재 결과 ===");
console.log("exam_papers:        " + papers_inserted);
console.log("exam_items:         " + items_inserted);
console.log("cards (quiz):       " + cards_quiz_inserted);
console.log("cards (keyword):    " + cards_keyword_inserted);
if (skipped_pre2002.length > 0) {
  console.log(
    `skipped (pre-${MIN_SEED_YEAR}): ${skipped_pre2002.length} — ${skipped_pre2002.join(", ")}`,
  );
}
console.log("errors:             " + errors.length);
if (errors.length > 0) {
  console.log("---ERRORS---");
  for (const e of errors.slice(0, 10)) console.log("  " + e);
}

await sql.end();
