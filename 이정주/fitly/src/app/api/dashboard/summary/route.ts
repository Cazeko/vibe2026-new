import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary } from "@/lib/dashboard/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 헌법 v1.10 — 대시보드 6위젯 단일 진입점.
// 각 위젯이 개별 호출하지 않고 Promise.all 로 한 번에 집계한다.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const summary = await getDashboardSummary(user.id);
    return NextResponse.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
