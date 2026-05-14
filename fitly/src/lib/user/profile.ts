import "server-only";

// 헌법 v3.0 제15조 — 사용자 프로필 SSR 조회 헬퍼 (코드리뷰 B.H2/H3 정합).
// 2026-05-15 PR-8 — 종전 클라이언트에서 `/api/user/profile` 을 페이지당 2~3회
// 중복 fetch 하던 회귀 해소. (main)/layout.tsx 가 본 헬퍼를 1회 호출하고 그 결과를
// ProfileProvider 로 모든 client 컴포넌트에 전달한다.

import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema/user-profiles";
import type { RegionName } from "@/types";

export type CurrentUserProfile = {
  userId: string;
  email: string | null;
  displayName: string | null;
  targetRegion: RegionName | null;
  examDate: string | null;
};

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const db = getDb();
  let row: typeof userProfiles.$inferSelect | null = null;
  try {
    const rows = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);
    row = rows[0] ?? null;
  } catch (e) {
    console.error("[getCurrentUserProfile] query failed", e);
    row = null;
  }

  // P0-01 fix (외부 리뷰 H1 — 2026-05-12) — userProfiles 스키마에 displayName
  // 컬럼이 없으므로 user_metadata.full_name → name → email local part fallback.
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metaFull = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const metaName = typeof meta.name === "string" ? meta.name.trim() : "";
  const emailLocal = user.email ? user.email.split("@")[0] : "";
  const displayName = metaFull || metaName || emailLocal || null;

  return {
    userId: user.id,
    email: user.email ?? null,
    displayName,
    targetRegion: (row?.targetUniversity ?? null) as RegionName | null,
    examDate: row?.examDate ?? null,
  };
}
