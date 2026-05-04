import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateExamItem, type ExamSection } from "@/lib/exam/generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 헌법 v1.8 제30조 4항 — RAG 시드 미완성 시점 출제는 학교 무관 일반 빈출 한정.
// API 입력 schema에서 university 필드를 받지 아니한다.
const schema = z.object({
  section: z.enum(["vocab", "grammar", "reading"]),
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

  try {
    const item = await generateExamItem(parsed.data.section as ExamSection);
    if (!item) {
      return NextResponse.json(
        { error: "출제 결과를 해석하지 못했습니다. 다시 시도해 주세요." },
        { status: 502 }
      );
    }
    return NextResponse.json({ item, answerSource: "ai_estimate" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "출제 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
