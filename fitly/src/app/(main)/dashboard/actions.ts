"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { studySessions, userStreakFreezes } from "@/lib/db/schema";

// 헌법 v3.5.1 제16조 — 잔디(Streak) 얼리기 server action. 듀오링고 차용
// retention 장치 (시행규칙 32 제34조 다듬기 정합).
//
// 정책:
//   1) 오늘 이미 학습 세션 1개 이상 → freeze 불요 (BadState 반환)
//   2) 오늘 이미 freeze 적용 → 중복 차단 (Duplicate 반환)
//   3) 30일 윈도우 내 freeze 2개 이상 사용 → 상한 초과 (LimitReached 반환)
//   4) 모든 조건 통과 시 frozen_date=today 로 insert.

const STREAK_FREEZE_WINDOW_DAYS = 30;
const STREAK_FREEZE_MAX = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function applyStreakFreezeToday(): Promise<
  { ok: true; frozenDate: string } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const db = getDb();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const since30Str = new Date(
    today.getTime() - STREAK_FREEZE_WINDOW_DAYS * DAY_MS,
  )
    .toISOString()
    .slice(0, 10);

  // 오늘 이미 학습했는지.
  const startOfToday = new Date(todayStr + "T00:00:00.000Z");
  const [studied] = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, user.id),
        gte(studySessions.startedAt, startOfToday),
      ),
    );
  if ((studied?.cnt ?? 0) > 0) return { error: "BadState" };

  // 30일 윈도우 freeze 카운트.
  const [usedRow] = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(userStreakFreezes)
    .where(
      and(
        eq(userStreakFreezes.userId, user.id),
        gte(userStreakFreezes.frozenDate, since30Str),
      ),
    );
  if ((usedRow?.cnt ?? 0) >= STREAK_FREEZE_MAX) {
    return { error: "LimitReached" };
  }

  // upsert.
  const inserted = await db
    .insert(userStreakFreezes)
    .values({ userId: user.id, frozenDate: todayStr })
    .onConflictDoNothing({
      target: [userStreakFreezes.userId, userStreakFreezes.frozenDate],
    })
    .returning({ id: userStreakFreezes.id });

  if (inserted.length === 0) return { error: "Duplicate" };

  revalidatePath("/dashboard");
  revalidatePath("/me");
  return { ok: true, frozenDate: todayStr };
}
