import { extractPdfText } from "./pdf";
import { extractImageText, type VisionMediaType } from "./vision";
import { validatePdfText, type PdfTextValidation } from "./validate";

export const ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type ImageMime = "image/png" | "image/jpeg" | "image/webp";

export async function extractTextFromFile(file: File): Promise<string> {
  return extractTextFromBuffer(
    Buffer.from(await file.arrayBuffer()),
    file.type,
  );
}

// 헌법 v1.10 D19 — Storage 에서 받아온 자료를 추출할 때 사용.
//
// 헌법 시행규칙 33 §35의2 폴백 매트릭스 (코드리뷰 M5, PR-12, 2026-05-15):
//   1차 — unpdf 텍스트 레이어 추출 (벡터 PDF 본문)
//   검증 — validatePdfText (길이·한글 비율)
//   2차 — Gemini Vision (PDF 바이트 직접 입력, multimodal)
//
// pdftocairo PNG 변환 단계는 생략 — Gemini Vision 이 application/pdf 를
// 직접 처리하므로 binary 의존성 없이 Vercel/Edge 환경에서 폴백 가능.
export async function extractTextFromBuffer(
  buf: Buffer,
  mime: string,
): Promise<string> {
  if (mime === "application/pdf") {
    return extractPdfTextWithFallback(buf);
  }

  if ((["image/png", "image/jpeg", "image/webp"] as const).includes(
    mime as ImageMime,
  )) {
    return extractImageText(buf.toString("base64"), mime as ImageMime);
  }

  throw new Error("지원하지 않는 파일 형식입니다.");
}

export type PdfExtractionResult = {
  text: string;
  source: "unpdf" | "gemini_vision";
  validation: PdfTextValidation;
};

// PDF 텍스트 추출 + 검증 + Vision 폴백을 단일 함수로 제공.
// 시드 파이프라인 (scripts/seed/) 이나 운영자 도구가 source 라벨을 보고
// 검증 라벨(verified_text)을 적절히 설정할 수 있도록 상세 객체 반환.
export async function extractPdfTextDetailed(
  buf: Buffer,
): Promise<PdfExtractionResult> {
  let unpdfText = "";
  try {
    unpdfText = await extractPdfText(buf);
  } catch (e) {
    console.warn("[ocr] unpdf failed → Vision fallback", e);
    unpdfText = "";
  }
  const validation = validatePdfText(unpdfText);
  if (validation.ok) {
    return { text: unpdfText, source: "unpdf", validation };
  }
  console.warn(
    `[ocr] unpdf validation fail (${validation.reason}, len=${validation.length}, hangul=${validation.hangulRatio.toFixed(2)}) → Vision fallback`,
  );
  const visionText = await extractImageText(
    buf.toString("base64"),
    "application/pdf" as VisionMediaType,
  );
  return { text: visionText, source: "gemini_vision", validation };
}

async function extractPdfTextWithFallback(buf: Buffer): Promise<string> {
  const r = await extractPdfTextDetailed(buf);
  return r.text;
}
