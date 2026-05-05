import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { mistakes } from "@/lib/db/schema/mistakes";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(mistakes)
      .where(eq(mistakes.userId, user.id))
      .orderBy(desc(mistakes.createdAt))
      .limit(100);

    return NextResponse.json({ items: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
