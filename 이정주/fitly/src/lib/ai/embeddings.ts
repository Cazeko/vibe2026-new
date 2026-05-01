import OpenAI from "openai";
import { env } from "@/lib/env";

let cached: OpenAI | null = null;

function getClient(): OpenAI {
  if (!cached) {
    cached = new OpenAI({ apiKey: env.openai.apiKey });
  }
  return cached;
}

const MODEL = env.openai.embeddingModel;

export async function embed(text: string): Promise<number[]> {
  const res = await getClient().embeddings.create({
    model: MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  const res = await getClient().embeddings.create({
    model: MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}
