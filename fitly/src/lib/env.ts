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
    //
    // 매트릭스 권장 ID (v3.6.3, 2026-05-14 주인님 발화 — 학습 본업 전 Flash 통일)
    //   - Pro:   gemini-2.5-pro    (Vision OCR / 코칭 / 팟캐스트 스크립트 등 미통일 영역)
    //   - Flash: gemini-2.5-flash  (학습 본업 — 채점/첨삭/챗봇/힌트/암기법/키워드 추출)
    //
    // fallback 정책 — 환경변수 미설정 시 *안정 운용* 모델로 폴백.
    // 운영 환경(Vercel)에서는 GEMINI_MODEL_PRO / GEMINI_MODEL_FLASH 환경변수
    // 를 명시 설정하여 매트릭스 정합을 보존한다.
    //
    // PR 6 이후 hotfix (LlmFailed 사고) — 신모델 ID (3.0-flash·3.1-pro-preview)
    // 가 환경/리전별 미가용 가능성이 있어 fallback 은 가용성이 검증된 안정 세대
    // (2.5-pro / 2.5-flash) 로 유지한다.
    get modelPro() {
      return optional("GEMINI_MODEL_PRO", "gemini-2.5-pro");
    },
    get modelFlash() {
      return optional("GEMINI_MODEL_FLASH", "gemini-2.5-flash");
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
