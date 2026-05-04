import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { mistakes, materials } from "@/lib/db/schema";
import { extractTextFromBuffer } from "@/lib/ocr";
import { extractMistakeCards } from "@/lib/ocr/mistake-cards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 헌법 v1.10 D19 — /materials 업로드된 PDF·이미지 → 자동 시카드 변환.
// Storage('materials' 버킷)에서 파일을 받아 PDF→텍스트→Gemini 추출 → mistakes 저장.
// 모든 추출 결과는 answerSource='ai_estimate' (제18조의2 — 검증 필요 라벨 의무).
// source='material' 로 마킹하여 /mistakes 에서 출처 식별 가능.
export async function POST(
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
      .select()
      .from(materials)
      .where(and(eq(materials.id, id), eq(materials.userId, user.id)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "자료를 찾을 수 없습니다." }, { status: 404 });
    }
    if (!row.storagePath) {
      return NextResponse.json(
        { error: "Storage 경로가 비어 있습니다." },
        { status: 400 },
      );
    }

    // Storage 다운로드
    const { data: blob, error: dlErr } = await supabase.storage
      .from("materials")
      .download(row.storagePath);
    if (dlErr || !blob) {
      throw new Error(dlErr?.message ?? "Storage 다운로드 실패");
    }

    const buf = Buffer.from(await blob.arrayBuffer());
    const mime = row.mimeType ?? "application/pdf";

    // OCR / PDF 텍스트 추출
    const text = await extractTextFromBuffer(buf, mime);
    if (!text.trim()) {
      await db
        .update(materials)
        .set({ status: "failed" })
        .where(eq(materials.id, id));
      return NextResponse.json({
        text: "",
        cards: [],
        saved: 0,
        message: "텍스트 추출 결과가 비어 있습니다.",
      });
    }

    // Gemini 카드 추출
    const cards = await extractMistakeCards(text);
    if (cards.length === 0) {
      await db
        .update(materials)
        .set({ status: "parsed" })
        .where(eq(materials.id, id));
      return NextResponse.json({
        text,
        cards: [],
        saved: 0,
        message: "추출된 카드가 없습니다.",
      });
    }

    // mistakes 저장 + materials 상태 갱신
    const saved = await db
      .insert(mistakes)
      .values(
        cards.map((c) => ({
          userId: user.id,
          question: c.question,
          choices: c.choices ?? null,
          answer: c.answer ?? null,
          explanation: c.explanation ?? null,
          keywords: c.keywords ?? [],
          source: "material",
          answerSource: "ai_estimate" as const,
        })),
      )
      .returning({ id: mistakes.id });

    await db
      .update(materials)
      .set({ status: "parsed" })
      .where(eq(materials.id, id));

    return NextResponse.json({
      text,
      cards,
      saved: saved.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "처리 중 오류 발생";
    // 추출 실패는 materials.status='failed' 로 마킹하여 재시도 UX 가능.
    try {
      await getDb()
        .update(materials)
        .set({ status: "failed" })
        .where(and(eq(materials.id, id), eq(materials.userId, user.id)));
    } catch {
      // 상태 갱신 실패는 무시
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
