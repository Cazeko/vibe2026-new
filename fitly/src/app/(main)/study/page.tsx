import { redirect } from "next/navigation";

// 헌법 v3.0 제13조 / v3.5 제13조의2 — 학습 진입은 /study-plan 으로 모은다.
// /study/[track] (quiz·keyword·mistake) 활동 페이지는 별도 라우트.
export default function LegacyStudyPage() {
  redirect("/study-plan");
}
