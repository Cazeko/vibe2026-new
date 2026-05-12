import { redirect } from "next/navigation";

// 헌법 v3.5.1 정합 — 레거시 /home 라우트는 데시보드로 흡수.
// (v1.9 시점의 임시 home 라우트로, 현재는 사용자 북마크 호환 목적으로만 유지)
// 폐기 후보: v3.6 또는 사용자 트래픽 통계 확인 후 docs/ROADMAP 에 폐기 일정 등재.
// 인증 가드는 middleware.ts (PROTECTED_PREFIXES 에 "/home" 포함)에서 처리한다.
export default function LegacyHomePage() {
  redirect("/dashboard");
}
