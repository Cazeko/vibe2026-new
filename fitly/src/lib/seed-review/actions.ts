"use server";

// 헌법 v3.5.1 시행규칙층 (rules/) — D-S9 운영자 검증 토글 server action.
// 헌법 제18조의2·제30조의2 정합: ai_estimate → official 승격 (운영자 1차 검수).
// 2026-05-12 — 헌법 제27~30 정합. server action 단에서 인증 가드를 추가한다.
// (현재 admin role 컬럼이 schema 에 없으므로 인증된 사용자 한정. Phase 2 에서
//  role 컬럼 추가 시 본 가드를 강화한다.)

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { examItems } from "@/lib/db/schema/exam-items";
import { createClient } from "@/lib/supabase/server";

async function requireAuthenticated(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("운영자 권한이 필요합니다 (로그인 후 다시 시도).");
  }
  // TODO Phase 2 — examItems 또는 profiles 에 role 컬럼 추가 후 admin 검증.
}

export async function markAnswerVerified(id: string): Promise<void> {
  await requireAuthenticated();
  const db = getDb();
  await db
    .update(examItems)
    .set({ verifiedAnswer: true, updatedAt: new Date() })
    .where(eq(examItems.id, id));
  revalidatePath("/admin/seed-review");
  revalidatePath(`/admin/seed-review/${id}`);
}

export async function unmarkAnswerVerified(id: string): Promise<void> {
  await requireAuthenticated();
  const db = getDb();
  await db
    .update(examItems)
    .set({ verifiedAnswer: false, updatedAt: new Date() })
    .where(eq(examItems.id, id));
  revalidatePath("/admin/seed-review");
  revalidatePath(`/admin/seed-review/${id}`);
}
