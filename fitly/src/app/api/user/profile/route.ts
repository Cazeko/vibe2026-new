import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema/user-profiles";
import { REGION_NAMES } from "@/types";

export const dynamic = "force-dynamic";

// 헌법 v3.0 제15조 — 지역 교육청 17개 라벨 (선택 입력).
// userProfiles.targetUniversity 컬럼은 v3.0에서 region 라벨로 임시 재해석한다
// (D-S2에서 컬럼 명칭 재정렬 예정).
const upsertSchema = z.object({
  targetUniversity: z.enum(REGION_NAMES).nullable().optional(),
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.")
    .nullable()
    .optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  // P0-01 fix (외부 리뷰 H1 — 2026-05-12) — userProfiles 스키마에는 displayName
  // 컬럼이 없으므로 UI 호칭({이름} 선생님)을 위해 user_metadata.full_name 또는
  // 이메일 로컬파트를 fallback 으로 합성 반환. 헌법 §16 스코프 보호로 신규
  // 컬럼 추가는 회피, 서버-측 합성으로 처리.
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metaFull = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  const metaName = typeof meta.name === "string" ? meta.name.trim() : "";
  const emailLocal = user.email ? user.email.split("@")[0] : "";
  const displayName = metaFull || metaName || emailLocal || null;

  const base = rows[0] ?? null;
  return NextResponse.json({
    profile: base ? { ...base, displayName } : { displayName },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const db = getDb();
  const [row] = await db
    .insert(userProfiles)
    .values({
      userId: user.id,
      targetUniversity: parsed.data.targetUniversity ?? null,
      examDate: parsed.data.examDate ?? null,
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        targetUniversity: parsed.data.targetUniversity ?? null,
        examDate: parsed.data.examDate ?? null,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return NextResponse.json({ profile: row });
}
