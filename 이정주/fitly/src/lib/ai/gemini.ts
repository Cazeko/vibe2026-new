import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";

let cached: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!cached) {
    cached = new GoogleGenAI({ apiKey: env.gemini.apiKey });
  }
  return cached;
}

export const GEMINI_MODELS = {
  get pro() {
    try {
      return env.gemini.modelPro;
    } catch {
      return "gemini-3.1-pro-preview";
    }
  },
  get flash() {
    try {
      return env.gemini.modelFlash;
    } catch {
      return "gemini-3.1-pro-preview";
    }
  },
  get embedding() {
    try {
      return env.gemini.embeddingModel;
    } catch {
      return "gemini-embedding-2";
    }
  },
};
