// 백승환 피드백 추가 보고 (2026-05-13) — 시험 본문 텍스트 가독성 가공.
//
// PDF unpdf 추출본은 줄바꿈·공백·문단 구분이 raw 한 상태. 본 함수는 *데이터를
// 변경하지 않고* 시각 표시용으로만 가공한다 (헌법 §13의2 9항 — stem_text 의
// 원본성은 DB 단에서 보존).
//
// 가공 규칙
// - 폼피드(\f)·캐리지(\r) 제거
// - 다중 공백 단일화 + 라인 trim
// - 3+ 빈 줄 → 2 빈 줄 (문단 경계 유지)
// - (가)/(나)/(다) 자료 마커 — 그 앞에 빈 줄 추가 (자료 블록 시작 명확화)
// - 1)/2)/3) 발문 번호 — 그 앞에 빈 줄 + 들여쓰기 마커
// - ①/②/③ 답란 — 그 앞에 빈 줄
// - 대화 마커 (`이름 :`) — 그 앞에 빈 줄
// - 어절 단위 줄바꿈 합치기 — PDF wrap 이 viewport 폭에 맞게 자연 wrap 되도록.
//   같은 문단 안에서 라인 끝이 종결자(.?!」』]등) 아니고 다음 라인이 marker
//   라인(번호·자료·답란) 아니면 공백으로 합친다.
//
// 출력은 plain text (whitespace-pre-wrap 으로 렌더). markdown 변환 X (시드
// 데이터 무손실 보존).

const CIRCLED_DIGITS = /[①②③④⑤⑥⑦⑧⑨⑩]/;
const PAREN_HANGUL = /^\(([가-힣])\)$/; // (가) (나) (다) 단독 라인
const NUMBER_PAREN = /^([0-9]+)\)\s*/; // 1) 2) 3) 발문
// 대화 마커 — "임 교사 :" "학 생 A :" 등 한국어 화자 명 + 콜론.
const DIALOG_SPEAKER = /^[가-힣A-Z](?:[\s가-힣A-Z]{0,8})\s*[:：]\s/;
// 라인 끝이 문장 종결자 — 줄바꿈 보존 신호.
const SENTENCE_END = /[.?!。？！」』\)\]…]\s*$/;
// 줄 시작이 marker — 줄바꿈 보존 신호.
const LINE_MARKER_START =
  /^(\(|[①②③④⑤⑥⑦⑧⑨⑩㉠㉡㉢㉣㉤㉥㉦㉧㉨㉩]|ⓐ|ⓑ|ⓒ|ⓓ|ⓔ|ⓕ|[0-9]+\)|[0-9]+\.|-\s)/;

export function formatExamStem(src: string): string {
  if (!src) return "";

  // 1. 기본 cleanup — 제어 문자 + 공백 정규화.
  const work = src
    .replace(/[\f\r]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // 2. 라인 단위 의미 분석 — marker 분리 + 어절 wrap 합치기.
  const lines = work.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      continue;
    }

    // (가)/(나)/(다) 단독 — 헤더 처리.
    if (PAREN_HANGUL.test(line)) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      out.push(line);
      out.push("");
      continue;
    }
    // (가) (나) 같이 단독 마커 라인.
    if (/^\s*(\([가-힣]\)\s*)+$/.test(line)) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      out.push(line);
      out.push("");
      continue;
    }

    // 1) 2) 3) 발문 번호.
    if (NUMBER_PAREN.test(line)) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      out.push(line);
      continue;
    }

    // ①②③ 답란.
    if (CIRCLED_DIGITS.test(line[0] ?? "")) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      out.push(line);
      continue;
    }

    // 대화 마커 (이름 + 콜론) — 그 앞에 빈 줄.
    if (DIALOG_SPEAKER.test(line)) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      out.push(line);
      continue;
    }

    // 일반 라인 — 직전 라인과 어절 wrap 합치기 검토.
    // 직전 라인이 종결자로 끝나거나 본 라인이 marker 로 시작하면 줄바꿈 유지.
    // 그 외는 공백으로 합쳐서 viewport 폭에 따라 자연 wrap.
    const prev = out.length > 0 ? out[out.length - 1] : "";
    if (prev && !SENTENCE_END.test(prev) && !LINE_MARKER_START.test(line)) {
      out[out.length - 1] = `${prev} ${line}`;
    } else {
      out.push(line);
    }
  }

  // 3. 후처리.
  let result = out.join("\n");
  result = result.replace(/\n{3,}/g, "\n\n").trim();
  return result;
}
