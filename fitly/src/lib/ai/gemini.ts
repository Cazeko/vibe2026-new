import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";

let cached: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!cached) {
    cached = new GoogleGenAI({ apiKey: env.gemini.apiKey });
  }
  return cached;
}

// 2026-05-17 — try/catch fallback 의 두 슬롯이 모두 `gemini-3.1-pro-preview` 였음.
// (1) env.ts 의 modelPro/modelFlash 는 optional() 기반이라 throw 하지 않으므로
//     본 try/catch 자체가 사실상 dead code 였고,
// (2) Flash 슬롯이 Pro Preview 로 폴백되어 있어 만에 하나 env 가 깨졌을 때
//     Flash 호출이 5~10s Pro 응답이 되며 Vercel function 30s 한도 누적 + preview
//     rate limit 사고 위험.
// env.ts 가 이미 안정 세대(2.5)로 폴백 보장하므로 본 파일은 그대로 위임.
export const GEMINI_MODELS = {
  get pro() {
    return env.gemini.modelPro;
  },
  get flash() {
    return env.gemini.modelFlash;
  },
  get embedding() {
    return env.gemini.embeddingModel;
  },
};
