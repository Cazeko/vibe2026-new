import { getAnthropic, ANTHROPIC_MODEL } from "@/lib/ai/anthropic";

export async function extractImageText(
  imageBase64: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp" = "image/png"
): Promise<string> {
  const client = getAnthropic();
  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: "이 시험지 이미지의 텍스트를 그대로 추출해 주세요. 문제 번호, 보기, 정답 표시를 보존합니다.",
          },
        ],
      },
    ],
  });

  const block = response.content.find((c) => c.type === "text");
  return block && block.type === "text" ? block.text : "";
}
