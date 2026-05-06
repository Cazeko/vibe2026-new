import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// 헌법 v3.0 / v3.0.1 제13조 — Phase 1 사이드바 + 시스템 라우트 보호.
// 폐기: /materials (v3.0.1 cut), /mistakes (Phase 2 보류).
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/study-plan",
  "/exam-analysis",
  "/study-analysis",
  "/me",
  "/settings",
  // 운영자 도구 — 헌법 제28조 정합 (D-S9 MVP, role 체크는 Phase 2)
  "/admin",
  // 레거시 호환 (단계적 마이그레이션 완료까지 보호 유지)
  "/home",
  "/study",
];
const AUTH_PREFIXES = ["/login", "/signup"];

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 헌법 제17조 5항 — Supabase OAuth (PKCE) callback 경로는
  // redirect 로직보다 먼저 통과시켜 토큰 교환을 보장한다 (D17 v1.8 정정).
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next({ request });
  }

  // 성능 최적화 — 보호도 인증 라우트도 아닌 *완전 공개 페이지* (예: /, /privacy 등)
  // 는 supabase.auth.getUser() 호출 자체를 건너뛴다 (한국→Supabase RTT 100-200ms 절약).
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthRoute = AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isProtected && !isAuthRoute) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.supabase.url,
    env.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return response;
}
