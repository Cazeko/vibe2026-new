import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 헌법 제17조 5항 + v1.8 미들웨어 패스스루.
// Supabase OAuth (PKCE) 콜백에서 인가 코드를 세션 토큰으로 교환한다.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_no_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const reason = encodeURIComponent(error.message);
    return NextResponse.redirect(`${origin}/login?error=oauth&reason=${reason}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

function sanitizeNext(value: string | null): string {
  // open redirect 방어 — 내부 경로(/로 시작)만 허용.
  // v3.5 — 인증 후 기본 진입점은 /dashboard (레거시 /home 경유 폐지).
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}
