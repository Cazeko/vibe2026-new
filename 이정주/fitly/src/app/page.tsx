import { redirect } from "next/navigation";

// 헌법 v1.9 제13조 — 진입 라우트는 데시보드로 단일화한다.
export default function RootPage() {
  redirect("/dashboard");
}
