import "server-only";

import { createClient } from "@/lib/supabase/server";

// 헌법 v3.6 법률17 제28조(인증/접근 제어) 정합 — 사용자 인증 가드.
// /review M8 fix (2026-05-18) — 종전 32 곳에서 반복되던
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) return ...
// 패턴을 단일 helper 로 추출. requireAdmin 과 동일 시그니처 + 동일 에러 패턴.
//
// 사용: try { const me = await requireUser(); ... } catch (e: UnauthorizedError) { ... }

export class UnauthorizedError extends Error {
  constructor(message = "로그인 후 다시 시도해 주세요.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireUser(): Promise<{
  id: string;
  email: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return { id: user.id, email: user.email ?? null };
}

export async function getOptionalUser(): Promise<{
  id: string;
  email: string | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
}
