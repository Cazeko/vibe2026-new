import { redirect } from "next/navigation";
import type { Metadata } from "next";

// 헌법 v3.0 제13조 / v3.5 제13조의2 — 학습 진입은 /study-plan 으로 모은다.
// /study/[track] (quiz·keyword·mistake) 활동 페이지는 별도 라우트.
// 헌법 §24의2 — 명시 근거: docs/audit/2026-05-12-pages-ux-audit.md 페이지 16.

// N1 — 레거시 진입(/study) 시 검색·미리보기 정합.
export const metadata: Metadata = {
  title: "학습 · Fitly",
  description: "학습 계획으로 이동합니다.",
};

export default function LegacyStudyPage() {
  redirect("/study-plan");
}
