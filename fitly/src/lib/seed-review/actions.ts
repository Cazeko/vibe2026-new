"use server";

// 헌법 v3.4 시행규칙층 (rules/) — D-S9 운영자 검증 토글 server action.
// 헌법 제18조의2·제30조의2 정합: ai_estimate → official 승격 (운영자 1차 검수).

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { examItems } from "@/lib/db/schema/exam-items";

export async function markAnswerVerified(id: string): Promise<void> {
  const db = getDb();
  await db
    .update(examItems)
    .set({ verifiedAnswer: true, updatedAt: new Date() })
    .where(eq(examItems.id, id));
  revalidatePath("/admin/seed-review");
  revalidatePath(`/admin/seed-review/${id}`);
}

export async function unmarkAnswerVerified(id: string): Promise<void> {
  const db = getDb();
  await db
    .update(examItems)
    .set({ verifiedAnswer: false, updatedAt: new Date() })
    .where(eq(examItems.id, id));
  revalidatePath("/admin/seed-review");
  revalidatePath(`/admin/seed-review/${id}`);
}
