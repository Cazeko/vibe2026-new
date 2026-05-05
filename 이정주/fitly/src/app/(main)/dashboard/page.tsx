import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { KpiCards } from "@/components/feature/dashboard/kpi-cards";
import { LearningTrend } from "@/components/feature/dashboard/learning-trend";
import { TodayPlan } from "@/components/feature/dashboard/today-plan";
import { RecentMaterials } from "@/components/feature/dashboard/recent-materials";
import { WeakTypes } from "@/components/feature/dashboard/weak-types";
import { AiRecommend } from "@/components/feature/dashboard/ai-recommend";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary } from "@/lib/dashboard/queries";

// 헌법 v1.10 — 대시보드는 서버 컴포넌트로 단일 진입점 페치(getDashboardSummary).
// 모든 위젯은 props 만 받아 렌더링한다.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const summary = await getDashboardSummary(user.id);
  const weakest = summary.weakTypes[0] ?? null;

  return (
    <div className="min-h-screen pb-4">
      <DashboardHeader />

      <div className="px-6 space-y-3">
        {summary.isEmpty && <OnboardingBanner />}

        <KpiCards kpi={summary.kpi} />

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <div className="xl:col-span-2">
            <LearningTrend data={summary.trend} />
          </div>
          <div>
            <TodayPlan items={summary.plan} />
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <RecentMaterials items={summary.recent} />
          <WeakTypes items={summary.weakTypes} />
          <AiRecommend weakest={weakest} />
        </section>

        <p className="pt-1 text-[10px] text-muted-foreground">
          본 대시보드의 KPI·차트·플랜은 <strong>본인 계정의 실제 학습 기록</strong>{" "}
          만으로 산출됩니다 (헌법 v2.0 제9조). 학교별 합격 컷·평균은 비공개이므로 Fitly 가
          보유하지 아니합니다 (제3조의2).
        </p>
      </div>
    </div>
  );
}

function OnboardingBanner() {
  return (
    <Card className="border-evergreen bg-evergreen/[0.06]">
      <CardContent className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 place-items-center rounded-full bg-evergreen text-primary-foreground"
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="font-serif text-base font-medium">Fitly 첫 방문을 환영합니다.</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              아래 3단계만 완료하시면 학습 진척도와 추이가 실시간으로 그려집니다.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/settings">1) 학교 선택</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/materials">2) 자료 업로드</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/study/exam">
              3) 학습 시작 <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Cloudflare Pages — Edge runtime (헌법 v2.1 + 제17조 5항 정합)
export const runtime = "edge";
