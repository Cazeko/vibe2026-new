import { redirect } from "next/navigation";

// 헌법 v1.9 제13조 — 레거시 라우트는 데시보드로 흡수.
export default function LegacyHomePage() {
  redirect("/dashboard");
}
