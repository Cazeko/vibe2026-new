import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { mistakes } from "@/lib/db/schema/mistakes";
import {
  extractTextFromFile,
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
} from "@/lib/ocr";
import { extractMistakeCards } from "@/lib/ocr/mistake-cards";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "form-data 형식이 아닙니다." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "파일이 첨부되지 않았습니다." },
      { status: 400 }
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "파일 크기가 10MB를 초과합니다." },
      { status: 413 }
    );
  }
  if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: "PDF 또는 이미지(PNG/JPG/WebP)만 업로드할 수 있습니다." },
      { status: 415 }
    );
  }

  try {
    const text = await extractTextFromFile(file);
    const mistakeCards = await extractMistakeCards(text);

    if (mistakeCards.length === 0) {
      return NextResponse.json({ text, mistakeCards: [], saved: [] });
    }

    const db = getDb();
    const saved = await db
      .insert(mistakes)
      .values(
        mistakeCards.map((s) => ({
          userId: user.id,
          question: s.question,
          choices: s.choices ?? null,
          answer: s.answer ?? null,
          explanation: s.explanation ?? null,
          keywords: s.keywords ?? [],
          source: "upload",
          answerSource: "ai_estimate",
        }))
      )
      .returning();

    return NextResponse.json({ text, mistakeCards, saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "처리 중 오류 발생";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
