import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema/user-profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UNI = [
  "한양",
  "중앙",
  "성균관",
  "경희",
  "이화",
  "서강",
  "홍익",
  "동국",
  "건국",
  "숭실",
] as const;

const upsertSchema = z.object({
  targetUniversity: z.enum(UNI).nullable().optional(),
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

  return NextResponse.json({ profile: rows[0] ?? null });
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
