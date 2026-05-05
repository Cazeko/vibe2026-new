import { getGemini, GEMINI_MODELS } from "./gemini";

export async function embed(text: string): Promise<number[]> {
  const client = getGemini();
  const res = await client.models.embedContent({
    model: GEMINI_MODELS.embedding,
    contents: text,
  });
  return res.embeddings?.[0]?.values ?? [];
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  const client = getGemini();
  const res = await client.models.embedContent({
    model: GEMINI_MODELS.embedding,
    contents: texts,
  });
  return res.embeddings?.map((e) => e.values ?? []) ?? [];
}
