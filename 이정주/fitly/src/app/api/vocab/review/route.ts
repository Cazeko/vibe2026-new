import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { vocabCards } from "@/lib/db/schema/vocab";
import {
  fsrsCardFromState,
  fsrsCardToState,
  reviewCard,
  newCard,
  type ReviewGrade,
} from "@/lib/srs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  cardId: z.string().uuid(),
  grade: z.enum(["again", "hard", "good", "easy"]),
});

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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }
  const { cardId, grade } = parsed.data;

  const db = getDb();
  const rows = await db
    .select()
    .from(vocabCards)
    .where(and(eq(vocabCards.id, cardId), eq(vocabCards.userId, user.id)))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "카드를 찾을 수 없습니다." }, { status: 404 });
  }
  const row = rows[0];

  const now = new Date();
  const previous = row.srsState ? fsrsCardFromState(row.srsState, now) : newCard(now);
  const result = reviewCard(previous, grade as ReviewGrade, now);
  const next = result.card;

  const lapsed = grade === "again";

  const [updated] = await db
    .update(vocabCards)
    .set({
      srsState: fsrsCardToState(next),
      dueAt: next.due,
      reviewCount: row.reviewCount + 1,
      lapseCount: row.lapseCount + (lapsed ? 1 : 0),
    })
    .where(and(eq(vocabCards.id, cardId), eq(vocabCards.userId, user.id)))
    .returning();

  return NextResponse.json({
    card: updated,
    nextDue: next.due.toISOString(),
  });
}
