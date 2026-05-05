import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { materials } from "@/lib/db/schema";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const db = getDb();
    const [row] = await db
      .select({ storagePath: materials.storagePath })
      .from(materials)
      .where(and(eq(materials.id, id), eq(materials.userId, user.id)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
    }

    if (row.storagePath) {
      await supabase.storage.from("materials").remove([row.storagePath]);
    }

    await db
      .delete(materials)
      .where(and(eq(materials.id, id), eq(materials.userId, user.id)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "삭제 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
