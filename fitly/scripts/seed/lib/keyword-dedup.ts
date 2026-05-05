/**
 * Phase 4-2a — Keyword Dedup
 *
 * 헌법 v3.3 제13조의2 — KeywordCard는 2002~2026 풀스코프 dedup이며 객관식
 * 시대 데이터도 포함된다 (제13조의2 8항). 본 스크립트는 papers/<id>/items.json의
 * `keywords` 필드를 모두 추출 → 정규화·동의어 통합 → 출현 좌표 누적 →
 * scripts/seed/data/keywords.json 한 파일로 산출한다.
 *
 * 후속 단계 2b (concept_note_md 생성)는 본 산출물을 입력으로 받는다.
 *
 * 실행:
 *   $ npx tsx fitly/scripts/seed/lib/keyword-dedup.ts
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

// ──────────────────────────────────────────────
// 경로
// ──────────────────────────────────────────────
const REPO_ROOT = resolve(__dirname, "../../../..");
const PAPERS_DIR = join(REPO_ROOT, "fitly/scripts/seed/data/papers");
const OUT_PATH = join(REPO_ROOT, "fitly/scripts/seed/data/keywords.json");

// ──────────────────────────────────────────────
// 타입
// ──────────────────────────────────────────────
interface RawItem {
  item_no: number;
  format?: string;
  domains?: string[];
  keywords?: string[];
}
interface RawPaper {
  paper: { year: number; session: string; format?: string };
  items: RawItem[];
}

interface Occurrence {
  year: number;
  session: string;
  item_no: number;
  format: string;
  paper_id: string;
}
interface KeywordEntry {
  keyword: string;
  raw_forms: string[];
  occurrences: Occurrence[];
  total_count: number;
  domains_distribution: Record<string, number>;
  concept_note_md: null;
}

// ──────────────────────────────────────────────
// 정규화 + 동의어 사전
// ──────────────────────────────────────────────

/**
 * 정규화 1차 — 공백·문자 노멀라이즈.
 *  - 양 끝 공백 제거
 *  - 연속 공백 → 단일 공백
 *  - 선두 # 마크 제거 (예: "#피아제" → "피아제")
 *  - 중점·구두점 통일 (·, ㆍ → · / 콜론 양 끝 공백)
 *  - 한글 NFC 정규화
 */
function normalizeShape(raw: string): string {
  let s = raw.normalize("NFC");
  s = s.replace(/^#+\s*/, "");
  s = s.replace(/\s+/g, " ").trim();
  // 중점 통일
  s = s.replace(/[ㆍ・]/g, "·");
  // "·" 양 끝 공백 제거
  s = s.replace(/\s*·\s*/g, "·");
  return s;
}

/**
 * 정규화 2차 — 표기 변형 통합 (rule-based).
 *  - 교육과정 연도 표기: "2022개정" / "2022 개정" / "2022개정 교육과정" → "2022 개정 교육과정"
 *  - "제N차" / "Nth" 통일: "7차 교육과정" / "제7차 교육과정" → "제7차 교육과정"
 *  - 후행 "교육과정" 누락 보정 — "2022 개정" 단독은 모호하니 그대로 둠 (오버매칭 회피)
 */
function applySynonymRules(input: string): string {
  let s = input;

  // "YYYY개정" → "YYYY 개정" (연도+개정 사이 공백 강제)
  s = s.replace(/(\d{4})\s*개정/g, "$1 개정");

  // "YYYY 개정" 뒤에 "교육과정"이 직접 붙어있지 않고 단독·중간 공백 후 따로면 합치기
  s = s.replace(/(\d{4} 개정)\s+교육과정/g, "$1 교육과정");
  // "YYYY 개정교육과정" (붙어 있을 때) 분리
  s = s.replace(/(\d{4} 개정)교육과정/g, "$1 교육과정");

  // "제N차" 통일
  s = s.replace(/^(\d)차 교육과정$/, "제$1차 교육과정");
  s = s.replace(/^제(\d)차교육과정$/, "제$1차 교육과정");

  // "통합 교과" / "통합교과" 통일 → "통합교과" (한 단어 명사로 통용)
  s = s.replace(/^통합 교과$/, "통합교과");

  // "창의적 체험 활동" / "창의적 체험활동" 통일 → "창의적 체험활동"
  s = s.replace(/^창의적 체험 활동$/, "창의적 체험활동");

  // "교수 학습" / "교수·학습" 통일 → "교수·학습"
  s = s.replace(/^교수 학습/, "교수·학습");

  return s.trim();
}

function canonical(raw: string): string {
  return applySynonymRules(normalizeShape(raw));
}

// ──────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────
function main() {
  const paperIds = readdirSync(PAPERS_DIR).filter((d) => {
    return existsSync(join(PAPERS_DIR, d, "items.json"));
  });

  const map = new Map<string, KeywordEntry>();
  const rawFormsByCanon = new Map<string, Set<string>>();

  let totalItems = 0;
  let totalKeywordInstances = 0;

  for (const paperId of paperIds) {
    const filePath = join(PAPERS_DIR, paperId, "items.json");
    const data: RawPaper = JSON.parse(readFileSync(filePath, "utf8"));
    const { year, session } = data.paper;

    for (const item of data.items) {
      totalItems += 1;
      const keywords = item.keywords ?? [];
      const format = item.format ?? "unknown";
      const domains = item.domains ?? [];

      for (const rawKw of keywords) {
        if (!rawKw || typeof rawKw !== "string") continue;
        totalKeywordInstances += 1;

        const canon = canonical(rawKw);
        if (!canon) continue;

        if (!rawFormsByCanon.has(canon)) {
          rawFormsByCanon.set(canon, new Set());
        }
        rawFormsByCanon.get(canon)!.add(rawKw);

        let entry = map.get(canon);
        if (!entry) {
          entry = {
            keyword: canon,
            raw_forms: [],
            occurrences: [],
            total_count: 0,
            domains_distribution: {},
            concept_note_md: null,
          };
          map.set(canon, entry);
        }

        entry.occurrences.push({
          year,
          session,
          item_no: item.item_no,
          format,
          paper_id: `${year}-${session}`,
        });
        entry.total_count += 1;

        for (const d of domains) {
          entry.domains_distribution[d] =
            (entry.domains_distribution[d] ?? 0) + 1;
        }
      }
    }
  }

  // raw_forms 채우기
  for (const [canon, set] of rawFormsByCanon.entries()) {
    const entry = map.get(canon);
    if (entry) entry.raw_forms = [...set].sort();
  }

  // 빈도 분포
  const buckets = { freq_1: 0, freq_2_3: 0, freq_4_10: 0, freq_11_plus: 0 };
  for (const entry of map.values()) {
    const c = entry.total_count;
    if (c === 1) buckets.freq_1 += 1;
    else if (c <= 3) buckets.freq_2_3 += 1;
    else if (c <= 10) buckets.freq_4_10 += 1;
    else buckets.freq_11_plus += 1;
  }

  // 정렬 — total_count desc, keyword asc
  const sorted = [...map.values()].sort((a, b) => {
    if (b.total_count !== a.total_count) return b.total_count - a.total_count;
    return a.keyword.localeCompare(b.keyword, "ko");
  });

  const output = {
    metadata: {
      total_papers: paperIds.length,
      total_items: totalItems,
      total_keyword_instances: totalKeywordInstances,
      unique_keywords: sorted.length,
      frequency_distribution: buckets,
      generated_at: new Date().toISOString(),
      generator: "fitly/scripts/seed/lib/keyword-dedup.ts",
      constitution_version: "v3.3",
    },
    keywords: sorted,
  };

  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf8");

  // 콘솔 보고
  console.log(`Papers: ${paperIds.length}`);
  console.log(`Items: ${totalItems}`);
  console.log(`Keyword instances: ${totalKeywordInstances}`);
  console.log(`Unique keywords (after dedup): ${sorted.length}`);
  console.log(`Frequency distribution:`, buckets);
  console.log("\nTop 20 by frequency:");
  for (const entry of sorted.slice(0, 20)) {
    const years = entry.occurrences.map((o) => o.year);
    const minY = Math.min(...years);
    const maxY = Math.max(...years);
    console.log(
      `  ${entry.total_count.toString().padStart(3)}  |  ${entry.keyword}  (${minY}~${maxY})`,
    );
  }
  console.log(`\nWritten: ${OUT_PATH}`);
}

main();
