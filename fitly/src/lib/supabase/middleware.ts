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

// 코드리뷰 L2 (2026-05-15) — 변형 메서드(POST/PATCH/PUT/DELETE)에 대한 CSRF
// defense-in-depth. SameSite=Lax 쿠키만으로는 일부 시나리오(폼 submit·preflight)
// 우회가 가능하므로 Origin 헤더의 host 가 요청 host 와 일치하는지 확인한다.
//
// hotfix (2026-05-15) — server action POST 는 next.js 내부 가드(`next-action`
// 헤더 + Next.js allowedOrigins 정책) 가 별도 검증하므로 본 middleware 검사에서
// 제외한다. Vercel proxy 환경에서 host header 가 `x-forwarded-host` 와 다를 때
// false positive 차단이 발생하던 회귀 (#62 머지 후 풀이/하이라이트 차단) 해소.
// 또한 Vercel proxy host 정합 위해 `x-forwarded-host` 를 우선 비교.
const STATE_CHANGING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function csrfOriginCheck(request: NextRequest): NextResponse | null {
  if (!STATE_CHANGING_METHODS.has(request.method)) return null;
  // Next.js server action POST 는 자체 보안 (next-action 헤더 식별 + allowedOrigins)
  // 으로 검증하므로 middleware 단에서 추가 검사 X.
  if (request.headers.has("next-action")) return null;
  const origin = request.headers.get("origin");
  if (!origin) return null; // 동일 origin 일반 fetch — Origin 헤더 없음. 통과.
  // Vercel/Cloudflare proxy 환경에서는 host 보다 x-forwarded-host 가 클라이언트
  // 실제 호스트와 일치. fallback 으로 host.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (!host) return null;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return new NextResponse("Forbidden: malformed origin", { status: 403 });
  }
  if (originHost !== host) {
    console.warn(`[csrf] origin mismatch: ${originHost} vs ${host}`);
    return new NextResponse("Forbidden: cross-origin", { status: 403 });
  }
  return null;
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 헌법 제17조 5항 — Supabase OAuth (PKCE) callback 경로는
  // redirect 로직보다 먼저 통과시켜 토큰 교환을 보장한다 (D17 v1.8 정정).
  // 코드리뷰 M3 (2026-05-15) — 종전 `/auth/*` prefix 패스스루를 `/auth/callback`
  // 정확 매칭으로 좁힘. 향후 `/auth/admin-reset` 류가 추가되어도 자동 인증 우회되지
  // 않도록 *명시 화이트리스트* 로 가드 (deny by default).
  if (pathname === "/auth/callback") {
    return NextResponse.next({ request });
  }

  const csrfBlock = csrfOriginCheck(request);
  if (csrfBlock) return csrfBlock;

  // 코드리뷰 M14 정책 결정문 (2026-05-15 PR-10 — 헌법 §17 정합):
  //
  //   * 성능 최적화 — 보호도 인증 라우트도 아닌 *완전 공개 페이지* (예: /, /privacy
  //     등) 는 supabase.auth.getUser() 호출 자체를 건너뛴다 (한국→Supabase RTT
  //     100-200ms 절약).
  //   * 트레이드오프: 비보호 라우트 진입 시 토큰 자동 갱신 미수행 → 만료 직전
  //     토큰이 유지되다가 보호 라우트 진입 시점에서 한 번 더 RTT 발생 가능.
  //   * 결정 (의도된 최적화): API 라우트 (`app/api/*`) 가 매 호출 `getUser()` 로
  //     세션 검증 + 갱신하므로 *실제 보안 표면*은 양호. 비보호 페이지 RTT 절약이
  //     사용자 체감 latency 에 더 큰 영향.
  //   * 변경 트리거: 토큰 갱신 누락으로 보호 페이지에서 401 회귀가 빈발하면
  //     PROTECTED_PREFIXES 도달 전 (예: `/`) 에서 lightweight refresh hook 도입.
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
    // 헌법 v1.9 제13조 — 데시보드가 인증 후 정식 진입점.
    // /home은 레거시 라우트로 page.tsx에서 다시 /dashboard로 redirect되지만
    // Vercel에서 두 hop이 stuck 또는 빈 화면 표시되는 경우가 있어 본 미들웨어
    // 단계에서 직접 /dashboard로 보낸다.
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
