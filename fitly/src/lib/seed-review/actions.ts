"use server";

// 헌법 v3.5.1 시행규칙층 (rules/) — D-S9 운영자 검증 토글 server action.
// 헌법 제18조의2·제30조의2 정합: ai_estimate → official 승격 (운영자 1차 검수).
// 2026-05-15 — 법률17 제28조 정합. `requireAdmin` 화이트리스트 가드로 강화
// (종전 인증 통과만 확인 → 임의 사용자 verified 토글 가능 critical 회귀 차단).

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { examItems } from "@/lib/db/schema/exam-items";
import { cardReports } from "@/lib/db/schema/card-reports";
import { requireAdmin } from "@/lib/auth/require-admin";

// 코드리뷰 M4 (2026-05-15 PR-11) — verified_answer 토글 시 answer_source enum 도
// 동반 갱신. true → 'official' (운영자 검수 완료), false → 'ai_estimate' 복귀.
// user_self_corrected / crowd_verified 는 별도 Phase 의 사용자 정정 흐름에서 갱신.
export async function markAnswerVerified(id: string): Promise<void> {
  await requireAdmin();
  const db = getDb();
  await db
    .update(examItems)
    .set({
      verifiedAnswer: true,
      answerSource: "official",
      updatedAt: new Date(),
    })
    .where(eq(examItems.id, id));
  revalidatePath("/admin/seed-review");
  revalidatePath(`/admin/seed-review/${id}`);
}

export async function unmarkAnswerVerified(id: string): Promise<void> {
  await requireAdmin();
  const db = getDb();
  await db
    .update(examItems)
    .set({
      verifiedAnswer: false,
      answerSource: "ai_estimate",
      updatedAt: new Date(),
    })
    .where(eq(examItems.id, id));
  revalidatePath("/admin/seed-review");
  revalidatePath(`/admin/seed-review/${id}`);
}

// 코드리뷰 C.H2 후속 (2026-05-15, 시행규칙 33 §35) — 운영자 신고 처리.
// reviewed = 신고 내용을 반영해 카드를 정정함. dismissed = 신고 내용을 기각함.
// 두 액션 모두 reviewedAt + reviewedBy 를 기록한다 (감사 추적).

export async function markReportReviewed(id: string): Promise<void> {
  const admin = await requireAdmin();
  const db = getDb();
  await db
    .update(cardReports)
    .set({
      status: "reviewed",
      reviewedAt: new Date(),
      reviewedBy: admin.id,
    })
    .where(eq(cardReports.id, id));
  revalidatePath("/admin/reports");
}

export async function markReportDismissed(id: string): Promise<void> {
  const admin = await requireAdmin();
  const db = getDb();
  await db
    .update(cardReports)
    .set({
      status: "dismissed",
      reviewedAt: new Date(),
      reviewedBy: admin.id,
    })
    .where(eq(cardReports.id, id));
  revalidatePath("/admin/reports");
}
