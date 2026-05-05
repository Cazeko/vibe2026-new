import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { mistakes } from "@/lib/db/schema/mistakes";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const schema = z.object({
  answer: z.string().min(1).max(4000),
  explanation: z.string().max(8000).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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

  // 헌법 v1.8 제30조의2 — 단일 사용자의 자가 정정은 'user_self_corrected'.
  // 'crowd_verified'로의 승격은 2명 이상 서로 다른 사용자의 동일 답 누적 시점에 별도 처리.
  const db = getDb();
  const [updated] = await db
    .update(mistakes)
    .set({
      answer: parsed.data.answer,
      explanation: parsed.data.explanation ?? null,
      answerSource: "user_self_corrected",
    })
    .where(and(eq(mistakes.id, id), eq(mistakes.userId, user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "카드를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ card: updated });
}
