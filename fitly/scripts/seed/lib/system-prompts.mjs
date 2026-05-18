// 헌법 v3.5 §25의2 (rules/35_seed_tagging.md) — 시드 LLM 태그 상한 정책.
// /review CRITICAL #C3 fix (2026-05-18) — 종전 docs/harness/seed-llm-prompts.md
// 만 규칙을 문서화했고 실제 시드 적재(load-db.mjs)는 cap 없이 ingest 하여
// 593/593 (100%) items 가 §25의2 위반이었음. 본 모듈이 헌법 근거 (§24의2) 를
// 코드로 명시 인용하고 load-db.mjs / 향후 step03 prompt 양쪽에서 강제한다.
//
// 정책 (§25의2):
//   1) 태그 상한 = 5개 (한 문항당)
//   2) 우선순위 (높음 → 낮음):
//      ① 영역(domains) — 11과목 + 교육학 (필수)
//      ② 인지수준(bloom) — 기억·이해·적용·분석·평가·창작 (필수)
//      ③ 문항형식(format) — 객관식·단답형·서술형·논술형 (필수)
//      ④ 키워드(keywords) — 최대 2개 (보조)
//   3) 5 초과 시 *낮은 우선순위부터 제거*
//   4) system prompt 에 본 규칙을 *명시 인용* (헌법 §24의2)
//   5) 운영자 5 초과 보존 필요 판단 시 사용자(주관자) 승인 후 본 모듈 개정

export const SEED_TAG_CAP_RULE = `
[헌법 §25의2 — 시드 태그 상한 5개]
- 영역(domains) + Bloom(인지수준) + 형식(format) = 필수 3개
- 키워드(keywords) = 최대 2개 (보조)
- 총 5개 초과 금지. 초과 시 키워드 → format → bloom → domain 순으로 제거.
`.trim();

export const MAX_KEYWORDS_PER_ITEM = 2;
export const MAX_TAGS_PER_ITEM = 5;

/** §25의2 — 키워드 배열 cap (low priority slot 2개). */
export function capSeedKeywords(keywords) {
  if (!Array.isArray(keywords)) return [];
  return keywords.slice(0, MAX_KEYWORDS_PER_ITEM);
}

/**
 * §25의2 검증 — { ok, count, exceeded }.
 * domains 1+, bloom 1, format 1, keywords ≤2 = 5 이내.
 */
export function validateSeedTags(item) {
  const d = Array.isArray(item?.domains) ? item.domains.length : 0;
  const b = item?.bloom != null ? 1 : 0;
  const f = item?.format != null ? 1 : 0;
  const k = Array.isArray(item?.keywords) ? item.keywords.length : 0;
  const total = d + b + f + k;
  return {
    ok: total <= MAX_TAGS_PER_ITEM,
    count: total,
    exceeded: Math.max(0, total - MAX_TAGS_PER_ITEM),
    breakdown: { domains: d, bloom: b, format: f, keywords: k },
  };
}
