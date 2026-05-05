import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { vocabCards } from "@/lib/db/schema/vocab";
import { VOCAB_SEED } from "@/lib/data/vocab-seed";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const db = getDb();
  const existing = await db
    .select({ id: vocabCards.id })
    .from(vocabCards)
    .where(eq(vocabCards.userId, user.id))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ inserted: 0, message: "이미 시드되어 있습니다." });
  }

  const rows = VOCAB_SEED.map((v) => ({
    userId: user.id,
    term: v.term,
    definition: v.definition,
    example: v.example ?? null,
    level: v.level ?? null,
    source: "vocab_seed",
  }));

  const inserted = await db.insert(vocabCards).values(rows).returning({
    id: vocabCards.id,
  });

  return NextResponse.json({ inserted: inserted.length });
}
