// 헌법 시행규칙 33 §35의2 — PDF 텍스트 추출 결과 검증.
// 코드리뷰 M5 (2026-05-15 PR-12) — unpdf 결과의 한글 비율·길이 검증으로 폰트
// 손상·이미지 PDF 감지. 임계 미달 시 호출자가 Vision OCR 폴백.

export type PdfTextValidation = {
  ok: boolean;
  length: number;
  hangulCount: number;
  hangulRatio: number; // 한글 글자 / 전체 글자 (공백 제외)
  reason?: "too_short" | "low_hangul_ratio" | "empty";
};

// 검증 기준 — 한국어 시험지 (KICE) 기준 통상치 기반.
//   minLength: 100자 — 한 페이지 분량 미달이면 폰트 손상 가능성 높음
//   minHangulRatio: 0.30 — 표·도식 페이지도 한글이 30% 이상 포함되는 경향
export const PDF_TEXT_MIN_LENGTH = 100;
export const PDF_TEXT_MIN_HANGUL_RATIO = 0.3;

// 한글 음절(가-힣) + 자모(ㄱ-ㅣ) 매칭.
const HANGUL_RE = /[가-힣ᄀ-ᇿ㄰-㆏]/g;

export function validatePdfText(text: string): PdfTextValidation {
  const stripped = text.replace(/\s+/g, "");
  const length = stripped.length;
  if (length === 0) {
    return {
      ok: false,
      length: 0,
      hangulCount: 0,
      hangulRatio: 0,
      reason: "empty",
    };
  }
  const hangulMatches = stripped.match(HANGUL_RE);
  const hangulCount = hangulMatches?.length ?? 0;
  const hangulRatio = hangulCount / length;

  if (length < PDF_TEXT_MIN_LENGTH) {
    return {
      ok: false,
      length,
      hangulCount,
      hangulRatio,
      reason: "too_short",
    };
  }
  if (hangulRatio < PDF_TEXT_MIN_HANGUL_RATIO) {
    return {
      ok: false,
      length,
      hangulCount,
      hangulRatio,
      reason: "low_hangul_ratio",
    };
  }
  return { ok: true, length, hangulCount, hangulRatio };
}
