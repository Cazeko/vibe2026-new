import { redirect } from "next/navigation";

// 헌법 v1.9 제13조 — 학습 메뉴는 /study-plan으로 이동.
// 활동 페이지(/study/vocab, /study/exam, /study/review)는 그대로 유지된다.
export default function LegacyStudyPage() {
  redirect("/study-plan");
}
