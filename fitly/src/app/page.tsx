import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 헌법 v3.5.1 제13조 — 진입 라우트는 인증 상태에 따라 분기한다.
// middleware 가 (auth)·(main) 라우트 경계에서 동일 분기를 수행하지만, "/" 자체
// 는 middleware matcher 의 public 경로로 통과되므로 본 서버 컴포넌트에서 한 번
// 더 분기한다. 분기 실패 시 (Supabase 일시 장애 등) /login 으로 안전 폴백.
// M2 fix — 헌법 제37조 정합 (장애 시 사용자 보고 + 안전 우회).
export default async function RootPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    redirect(user ? "/dashboard" : "/login");
  } catch (err) {
    // Next.js 의 redirect()는 NEXT_REDIRECT throw 로 동작하므로 catch 에서
    // 재 throw 한다. 그 외 실제 에러(Supabase fetch 실패 등)는 /login 으로 폴백.
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest: unknown }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("[root page] auth check failed, fallback to /login", err);
    redirect("/login");
  }
}
