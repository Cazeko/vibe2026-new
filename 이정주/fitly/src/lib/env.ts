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
    get modelPro() {
      return optional("GEMINI_MODEL_PRO", "gemini-2.5-pro");
    },
    get modelFlash() {
      return optional("GEMINI_MODEL_FLASH", "gemini-2.5-flash");
    },
    get embeddingModel() {
      return optional("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001");
    },
  },
  app: {
    get url() {
      return optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    },
  },
};
