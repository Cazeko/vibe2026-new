import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // 코드리뷰 D.H3 (2026-05-15) — auth/callback 은 PKCE 코드 교환 보존을 위해
  // matcher 단계에서 제외. `lib/supabase/middleware.ts` 의 가드와 이중 방어.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/.*|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
