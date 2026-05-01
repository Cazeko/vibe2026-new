import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let cached: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!cached) {
    cached = new Anthropic({ apiKey: env.anthropic.apiKey });
  }
  return cached;
}

export const ANTHROPIC_MODEL = (() => {
  try {
    return env.anthropic.model;
  } catch {
    return "claude-sonnet-4-5-20250929";
  }
})();
