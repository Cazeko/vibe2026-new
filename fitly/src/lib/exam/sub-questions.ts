// 백승환 #6 (2026-05-15) — 서술형 소문항 분리 헬퍼.
//
// 임용 1차 서술형은 보통 (가)·(나)·(다), 1)·2)·3), ①·②·③ 식으로 소문항이
// 여러 개. 본 PR4 는 *시드 파이프라인 미변경* 으로 client side 정규식 추출만
// 수행한다 (헌법 §16 v3.6.4 — 사용자 명시 요청, schema 변경 회피).
//
// 두 가지 책임:
//   1. detectSubQuestions(stemText) — stem 에서 발문 라벨 추출.
//   2. parseAnswer / serializeAnswer — 답안 string ↔ 소문항 배열 변환.

const HANGUL_LABELS = ["가", "나", "다", "라", "마", "바"] as const;
const NUMBER_LABELS = ["1", "2", "3", "4", "5", "6"] as const;
const CIRCLED_LABELS = ["①", "②", "③", "④", "⑤", "⑥"] as const;

export type SubQuestionLabel = string;

// stem 에서 발문 패턴 자동 감지. 발견된 라벨 셋 (예: ["가","나","다"]) 반환.
// 미발견 시 빈 배열 (= 단일 답안란).
export function detectSubQuestions(stemText: string): SubQuestionLabel[] {
  if (!stemText) return [];

  // 패턴 1: (가)·(나)·(다) 단독 라벨 (자료 마커와 발문이 모두 사용하지만,
  //         "(가)에" "(나)는" 처럼 조사 결합한 발문 라벨만 추출).
  const hangulMatches = new Set<string>();
  const hangulRegex = /\(([가-힣])\)(?:에|는|의|을|를|에서|에는|에서는|이|가|와|과|도|만|로|으로)/g;
  let m: RegExpExecArray | null;
  while ((m = hangulRegex.exec(stemText)) !== null) {
    if (HANGUL_LABELS.includes(m[1] as (typeof HANGUL_LABELS)[number])) {
      hangulMatches.add(m[1]);
    }
  }
  if (hangulMatches.size >= 2) {
    return HANGUL_LABELS.filter((l) => hangulMatches.has(l));
  }

  // 패턴 2: 1)·2)·3) 발문 번호 (라인 시작).
  const numberMatches = new Set<string>();
  const numberRegex = /(?:^|\n)\s*([1-6])\)/g;
  while ((m = numberRegex.exec(stemText)) !== null) {
    numberMatches.add(m[1]);
  }
  if (numberMatches.size >= 2) {
    return NUMBER_LABELS.filter((l) => numberMatches.has(l));
  }

  // 패턴 3: ①·②·③ 답란 마커.
  const circledMatches: string[] = [];
  for (const c of CIRCLED_LABELS) {
    if (stemText.includes(c)) circledMatches.push(c);
  }
  if (circledMatches.length >= 2) return circledMatches;

  return [];
}

export type SubAnswer = {
  label: SubQuestionLabel | null;
  text: string;
};

// 합산 answer string → 소문항 배열. 라벨이 없으면 단일 항목.
// 형식: "(가) ...\n\n(나) ...\n\n(다) ..." 또는 "1) ...\n\n2) ..."
//      또는 "① ...\n\n② ..." 또는 단일 텍스트.
export function parseAnswer(combined: string): SubAnswer[] {
  if (!combined.trim()) return [{ label: null, text: "" }];

  // 한글 (가)/(나) 패턴 시도.
  const hangulRe = /\(([가-힣])\)\s*/g;
  const hangulHits = combined.match(hangulRe);
  if (hangulHits && hangulHits.length >= 2) {
    return splitByPattern(combined, /\(([가-힣])\)\s*/g);
  }

  // 1)/2) 패턴.
  const numberRe = /(?:^|\n)\s*([1-6])\)\s*/g;
  const numberHits = combined.match(numberRe);
  if (numberHits && numberHits.length >= 2) {
    return splitByPattern(combined, /(?:^|\n)\s*([1-6])\)\s*/g);
  }

  // ①/② 패턴.
  let circledCount = 0;
  for (const c of CIRCLED_LABELS) if (combined.includes(c)) circledCount++;
  if (circledCount >= 2) {
    return splitByPattern(combined, /([①②③④⑤⑥])\s*/g);
  }

  return [{ label: null, text: combined }];
}

function splitByPattern(text: string, pattern: RegExp): SubAnswer[] {
  const result: SubAnswer[] = [];
  const matches: { label: string; index: number; matchLen: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    matches.push({ label: m[1], index: m.index, matchLen: m[0].length });
  }
  if (matches.length === 0) return [{ label: null, text }];
  // 첫 매치 이전 텍스트가 있으면 무라벨 prepend (보통 빈 문자열).
  if (matches[0].index > 0) {
    const prefix = text.slice(0, matches[0].index).trim();
    if (prefix) result.push({ label: null, text: prefix });
  }
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].matchLen;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    result.push({
      label: matches[i].label,
      text: text.slice(start, end).trim(),
    });
  }
  return result;
}

// 소문항 배열 → 합산 string. 라벨 형식별로 다르게 직렬화.
export function serializeAnswer(subs: SubAnswer[]): string {
  if (subs.length === 0) return "";
  if (subs.length === 1 && !subs[0].label) return subs[0].text;
  return subs
    .map((s) => {
      if (!s.label) return s.text;
      // 한글 라벨은 (가) 형태, 숫자는 1) 형태, 원형숫자는 그대로.
      if (HANGUL_LABELS.includes(s.label as (typeof HANGUL_LABELS)[number])) {
        return `(${s.label}) ${s.text}`;
      }
      if (NUMBER_LABELS.includes(s.label as (typeof NUMBER_LABELS)[number])) {
        return `${s.label}) ${s.text}`;
      }
      return `${s.label} ${s.text}`;
    })
    .join("\n\n");
}

// 라벨 셋에서 다음 라벨 1개 추가 시 가장 자연스러운 후보 반환.
// 예: 현재 ["가","나"] → "다", ["1","2"] → "3", ["①"] → "②".
export function nextLabel(currentLabels: (string | null)[]): string {
  const used = new Set(currentLabels.filter((l): l is string => !!l));
  // family 별로 narrow 한 타입 보존을 위해 readonly any[] 로 처리.
  const families: readonly (readonly string[])[] = [
    HANGUL_LABELS,
    NUMBER_LABELS,
    CIRCLED_LABELS,
  ];
  for (const family of families) {
    if (currentLabels.some((l) => l && family.includes(l))) {
      for (const label of family) {
        if (!used.has(label)) return label;
      }
    }
  }
  // 사용 family 미식별 시 한글 첫 미사용 라벨.
  for (const label of HANGUL_LABELS) {
    if (!used.has(label)) return label;
  }
  return "?";
}
