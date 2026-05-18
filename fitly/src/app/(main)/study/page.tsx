import { redirect } from "next/navigation";
import type { Metadata } from "next";

// 헌법 §13 (laws/12_sidebar_structure.md) — 학습(/study) = 3 트랙 SRS 큐.
// 풀이(quiz) / 키워드(keyword) / 오답(mistake) 트랙으로 분기.
//
// 2026-05-18 hotfix — 종전 `/study-plan` 으로 redirect 하던 v3.0 시점 임시
// 정합을 헌법 §13 본문 정합으로 정정. default 트랙은 풀이(quiz) — 가장 익숙한
// 학습자 진입점. 추후 3 트랙 hub 페이지 도입 시 본 redirect 제거.
// (이전 버그: 사이드바 "학습" 클릭 시 /study-plan 으로 이동.)

// N1 — 레거시 진입(/study) 시 검색·미리보기 정합.
export const metadata: Metadata = {
  title: "학습 · Fitly",
  description: "오늘의 SRS 큐로 이동합니다.",
};

export default function StudyIndexPage() {
  // default 트랙 = 풀이 (헌법 §13의2 — QuizCard 가 가장 익숙한 진입).
  redirect("/study/quiz");
}
