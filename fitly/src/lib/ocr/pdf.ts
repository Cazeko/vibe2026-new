// 헌법 v2.1 + 제17조 5항 — Cloudflare Pages edge runtime 호환을 위해
// pdf-parse(Node 전용) → unpdf(edge/web 호환) 로 교체.
import { extractText, getDocumentProxy } from "unpdf";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const uint8 = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(uint8);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}
