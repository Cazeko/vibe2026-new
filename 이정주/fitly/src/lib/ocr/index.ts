import { extractPdfText } from "./pdf";
import { extractImageText } from "./vision";

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
export async function extractTextFromBuffer(
  buf: Buffer,
  mime: string,
): Promise<string> {
  if (mime === "application/pdf") {
    return extractPdfText(buf);
  }

  if ((["image/png", "image/jpeg", "image/webp"] as const).includes(
    mime as ImageMime,
  )) {
    return extractImageText(buf.toString("base64"), mime as ImageMime);
  }

  throw new Error("지원하지 않는 파일 형식입니다.");
}
