function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  supabase: {
    get url() {
      return required("NEXT_PUBLIC_SUPABASE_URL");
    },
    get anonKey() {
      return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    },
    get serviceRoleKey() {
      return optional("SUPABASE_SERVICE_ROLE_KEY");
    },
  },
  database: {
    get url() {
      return required("DATABASE_URL");
    },
  },
  gemini: {
    get apiKey() {
      return required("GEMINI_API_KEY");
    },
    // 헌법 제18조 — 성능 최우선 정책의 모델 매트릭스 fallback.
    // 2026-05-14 PR 2 — Flash 티어 fallback 을 신모델 자동 업그레이드 정합으로
    // gemini-3.0-flash 갱신 (디자인 문서 §3 정합).
    get modelPro() {
      return optional("GEMINI_MODEL_PRO", "gemini-3.1-pro-preview");
    },
    get modelFlash() {
      return optional("GEMINI_MODEL_FLASH", "gemini-3.0-flash");
    },
    get embeddingModel() {
      return optional("GEMINI_EMBEDDING_MODEL", "gemini-embedding-2");
    },
  },
  app: {
    get url() {
      return optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    },
  },
};
