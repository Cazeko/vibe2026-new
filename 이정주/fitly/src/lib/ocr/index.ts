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
  if (file.type === "application/pdf") {
    const buf = Buffer.from(await file.arrayBuffer());
    return extractPdfText(buf);
  }

  if ((["image/png", "image/jpeg", "image/webp"] as const).includes(
    file.type as ImageMime
  )) {
    const arr = await file.arrayBuffer();
    const base64 = Buffer.from(arr).toString("base64");
    return extractImageText(base64, file.type as ImageMime);
  }

  throw new Error("지원하지 않는 파일 형식입니다.");
}
