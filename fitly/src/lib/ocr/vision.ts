import { getGemini, GEMINI_MODELS } from "@/lib/ai/gemini";

const PROMPT =
  "이 시험지 이미지의 텍스트를 그대로 추출해 주세요. 문제 번호, 보기, 정답 표시를 보존합니다. 추출된 원문 텍스트만 출력하고 추가 설명은 금지합니다.";

// 헌법 시행규칙 33 §35의2 (코드리뷰 M5, PR-12) — Gemini Vision 은 PDF 자체를
// multimodal 입력으로 받을 수 있으므로 pdftocairo PNG 변환 없이 PDF 바이트를
// 그대로 전달 가능. Vercel/Edge 환경에서 binary 의존성 없이 폴백 가능.
export type VisionMediaType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "application/pdf";

export async function extractImageText(
  imageBase64: string,
  mediaType: VisionMediaType = "image/png"
): Promise<string> {
  const client = getGemini();
  const res = await client.models.generateContent({
    model: GEMINI_MODELS.pro,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mediaType, data: imageBase64 } },
          { text: PROMPT },
        ],
      },
    ],
  });
  return res.text ?? "";
}
