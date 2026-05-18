import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Lightbulb, AlertCircle, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/server";
import { getReviewDueCardCounts } from "@/lib/db/queries";

// 헌법 §13 (laws/12_sidebar_structure.md) — 학습 (/study) = 3 트랙 SRS 큐 hub.
// 풀이(QuizCard) · 키워드(KeywordCard) · 오답(MistakeCard) 트랙 카드 + 오늘 due 카운트.
//
// 2026-05-18 정정 — 종전 redirect (`/study-plan` 또는 `/study/quiz`) 를 폐지하고
// 본격 hub 페이지로 구현. 사이드바 "학습" 클릭 = 트랙 선택, "풀이" 클릭 = 직접
// 풀이 진입으로 동선 분리.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "학습 · Fitly",
  description:
    "오늘 복습할 카드를 풀이·키워드·오답 3 트랙에서 선택하세요.",
};

const TRACKS = [
  {
    href: "/study/quiz",
    label: "풀이",
    desc: "기출 서술형 — 직접 답안 작성 + AI 모범답안 비교",
    Icon: Pencil,
    key: "quiz" as const,
  },
  {
    href: "/study/keyword",
    label: "키워드",
    desc: "개념 정리 노트 — 정의·핵심 요소·출제 이력",
    Icon: Lightbulb,
    key: "keyword" as const,
  },
  {
    href: "/study/mistake",
    label: "오답",
    desc: "다시/어려움 자동 합류 — 다시 풀어보기",
    Icon: AlertCircle,
    key: "mistake" as const,
  },
];

export default async function StudyHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/study");

  const due = await getReviewDueCardCounts(user.id);
  const totalDue = due.quiz + due.keyword + due.mistake;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="학습"
        subtitle={
          totalDue > 0
            ? `오늘 복습할 카드 ${totalDue}장 — 트랙을 골라 시작하세요.`
            : "오늘 복습할 카드가 없습니다. 풀이 페이지에서 새 문항을 시도해 보세요."
        }
      />
      <div className="px-4 sm:px-6 lg:px-10 mx-auto max-w-5xl w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
          {TRACKS.map(({ href, label, desc, Icon, key }) => {
            const count = due[key];
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className="group block rounded-xl border border-rule bg-card p-5 lg:p-6 hover:border-evergreen hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <Icon className="h-6 w-6 text-evergreen" aria-hidden />
                  <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">
                    {count > 0 ? `${count}장 복습` : "복습 없음"}
                  </span>
                </div>
                <h2 className="mt-4 font-serif text-[18px] lg:text-[20px] font-medium tracking-tight">
                  {label}
                </h2>
                <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
                  {desc}
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-evergreen group-hover:gap-2 transition-all">
                  시작하기
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
