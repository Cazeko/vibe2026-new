import { getGemini, GEMINI_MODELS } from "@/lib/ai/gemini";

const PROMPT =
  "이 시험지 이미지의 텍스트를 그대로 추출해 주세요. 문제 번호, 보기, 정답 표시를 보존합니다. 추출된 원문 텍스트만 출력하고 추가 설명은 금지합니다.";

export async function extractImageText(
  imageBase64: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp" = "image/png"
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
