import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { materials } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 헌법 v1.10 — 자료 목록 GET / 메타데이터 POST.
// 파일 본체 업로드는 클라이언트가 supabase-js 로 Storage(materials 버킷)에 직접 PUT한 후
// 본 API 에 메타만 저장한다. RLS는 storage 측 정책 + 본 테이블 정책 양쪽에서 강제.
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
      .from(materials)
      .where(eq(materials.userId, user.id))
      .orderBy(desc(materials.createdAt))
      .limit(100);
    return NextResponse.json({ items: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type Body = {
  name?: string;
  storagePath?: string;
  mimeType?: string;
  sizeBytes?: number;
  pages?: number;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name || name.length > 256) {
    return NextResponse.json({ error: "name 이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const db = getDb();
    const [row] = await db
      .insert(materials)
      .values({
        userId: user.id,
        name,
        storagePath: body.storagePath ?? null,
        mimeType: body.mimeType ?? null,
        sizeBytes: body.sizeBytes ?? null,
        pages: body.pages ?? null,
        status: "uploaded",
        source: "upload",
      })
      .returning();

    return NextResponse.json({ item: row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "저장 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
