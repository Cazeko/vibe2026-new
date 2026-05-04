"use client";

import { createBrowserClient } from "@supabase/ssr";

// 클라이언트 번들에서 env.ts(서버 비공개 키 포함)를 끌어오면 빌드가 깨진다.
// NEXT_PUBLIC_* 만 직접 참조하되, 부재 시 즉시 throw하여 침묵 실패를 방지한다.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase 클라이언트 환경변수가 누락되었습니다 (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }
  return createBrowserClient(url, key);
}
