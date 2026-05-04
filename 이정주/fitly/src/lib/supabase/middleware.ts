import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// 헌법 v1.9 제13조 — 사이드바 7+2 라우트 보호
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/study-plan",
  "/materials",
  "/exam-analysis",
  "/study-analysis",
  "/mistakes",
  "/me",
  "/settings",
  // 레거시 호환 (단계적 마이그레이션 완료까지 보호 유지)
  "/home",
  "/study",
];
const AUTH_PREFIXES = ["/login", "/signup"];

export async function updateSession(request: NextRequest) {
  // 헌법 제17조 5항 — Supabase OAuth (PKCE) callback 경로는
  // redirect 로직보다 먼저 통과시켜 토큰 교환을 보장한다 (D17 v1.8 정정).
  if (request.nextUrl.pathname.startsWith("/auth/")) {
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

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthRoute = AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

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
