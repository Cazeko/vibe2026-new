import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/require-admin";

// 헌법 v3.5 법률17 제28조 정합 — `/admin/*` 단일 진입점 화이트리스트 가드.
// 비-운영자는 즉시 `/dashboard` 로 우회시켜 운영자 전용 페이지의 존재 자체를
// 노출하지 않는다 (robots noindex 만으로는 충분치 않음).

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ok = await isAdmin();
  if (!ok) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
