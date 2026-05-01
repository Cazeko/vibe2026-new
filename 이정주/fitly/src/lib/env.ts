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
  anthropic: {
    get apiKey() {
      return required("ANTHROPIC_API_KEY");
    },
    get model() {
      return optional("ANTHROPIC_MODEL", "claude-sonnet-4-5-20250929");
    },
  },
  openai: {
    get apiKey() {
      return required("OPENAI_API_KEY");
    },
    get embeddingModel() {
      return optional("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small");
    },
  },
  app: {
    get url() {
      return optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    },
  },
};
