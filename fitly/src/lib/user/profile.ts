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

  // 2026-05-15 — Promise.race timeout 가드. (main)/layout.tsx 가 매 라우트 전환마다
  // 본 헬퍼를 await 하므로 DB 응답 지연(서울→Supabase RTT spike·cold start)이 곧
  // 페이지 무한 로딩으로 이어지는 회귀가 보고됨. row=null fallback 으로 페이지는
  // 그래도 렌더되도록 그래스풀 디그레이드. statement_timeout 8s 보다 짧게 잡아
  // 사용자 체감 hang 을 5s 이내로 묶는다.
  const db = getDb();
  const PROFILE_TIMEOUT_MS = 5_000;
  let row: typeof userProfiles.$inferSelect | null = null;
  try {
    const rows = await Promise.race([
      db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.id))
        .limit(1),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("getCurrentUserProfile timeout")),
          PROFILE_TIMEOUT_MS,
        ),
      ),
    ]);
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
