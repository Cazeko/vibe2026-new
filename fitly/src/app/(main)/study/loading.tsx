import { PageSkeleton } from "@/components/shared/page-skeleton";

// L1 — /study 진입 시 redirect("/study-plan") 까지의 짧은 빈 화면 방지.
// 명시 근거: docs/audit/2026-05-12-pages-ux-audit.md 페이지 16 L1.
export default function Loading() {
  return <PageSkeleton title="학습" rows={2} />;
}
