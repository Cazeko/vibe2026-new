import "server-only";

import { createClient } from "@/lib/supabase/server";

// 헌법 v3.5 법률17 제28조(접근 제어) 정합 — 운영자 권한 가드.
// 운영자 화이트리스트는 환경변수 `ADMIN_USER_IDS` (콤마 구분 UUID) 로 관리한다.
// 미설정 또는 빈 값이면 *deny by default* — 누구도 admin 권한을 갖지 못한다.
// Phase 2 에서 `profiles.role` 컬럼이 도입되면 본 헬퍼 내부만 교체한다.

function getAdminUserIds(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

export class AdminRequiredError extends Error {
  constructor(message = "운영자 권한이 필요합니다.") {
    super(message);
    this.name = "AdminRequiredError";
  }
}

export async function requireAdmin(): Promise<{
  id: string;
  email: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new AdminRequiredError("로그인 후 다시 시도해 주세요.");
  }
  const adminIds = getAdminUserIds();
  if (adminIds.size === 0 || !adminIds.has(user.id)) {
    throw new AdminRequiredError();
  }
  return { id: user.id, email: user.email ?? null };
}

export async function isAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
