import { NextResponse } from "next/server";
import { and, eq, lte, asc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { vocabCards } from "@/lib/db/schema/vocab";

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

  const db = getDb();
  const now = new Date();
  const queue = await db
    .select()
    .from(vocabCards)
    .where(
      and(eq(vocabCards.userId, user.id), lte(vocabCards.dueAt, now))
    )
    .orderBy(asc(vocabCards.dueAt))
    .limit(20);

  return NextResponse.json({ items: queue });
}
