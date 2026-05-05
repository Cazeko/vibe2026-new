import { NextResponse } from "next/server";
import { and, asc, eq, lte } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { mistakes } from "@/lib/db/schema/mistakes";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const db = getDb();
  const queue = await db
    .select()
    .from(mistakes)
    .where(
      and(eq(mistakes.userId, user.id), lte(mistakes.dueAt, new Date()))
    )
    .orderBy(asc(mistakes.dueAt))
    .limit(20);

  return NextResponse.json({ items: queue });
}
