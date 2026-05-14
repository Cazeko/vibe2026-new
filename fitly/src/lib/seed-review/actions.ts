"use server";

// 헌법 v3.5.1 시행규칙층 (rules/) — D-S9 운영자 검증 토글 server action.
// 헌법 제18조의2·제30조의2 정합: ai_estimate → official 승격 (운영자 1차 검수).
// 2026-05-15 — 법률17 제28조 정합. `requireAdmin` 화이트리스트 가드로 강화
// (종전 인증 통과만 확인 → 임의 사용자 verified 토글 가능 critical 회귀 차단).

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { examItems } from "@/lib/db/schema/exam-items";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function markAnswerVerified(id: string): Promise<void> {
  await requireAdmin();
  const db = getDb();
  await db
    .update(examItems)
    .set({ verifiedAnswer: true, updatedAt: new Date() })
    .where(eq(examItems.id, id));
  revalidatePath("/admin/seed-review");
  revalidatePath(`/admin/seed-review/${id}`);
}

export async function unmarkAnswerVerified(id: string): Promise<void> {
  await requireAdmin();
  const db = getDb();
  await db
    .update(examItems)
    .set({ verifiedAnswer: false, updatedAt: new Date() })
    .where(eq(examItems.id, id));
  revalidatePath("/admin/seed-review");
  revalidatePath(`/admin/seed-review/${id}`);
}
