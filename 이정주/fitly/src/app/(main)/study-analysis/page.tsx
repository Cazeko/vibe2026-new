import { redirect } from "next/navigation";
import { Activity, Target, Layers } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { LearningTrend } from "@/components/feature/dashboard/learning-trend";
import { WeakTypes } from "@/components/feature/dashboard/weak-types";
import { ActivityHeatmap } from "@/components/feature/analysis/activity-heatmap";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary } from "@/lib/dashboard/queries";
import {
  getActivityHeatmap,
  getSessionStats,
  getLibraryCounts,
} from "@/lib/dashboard/analytics";

export const dynamic = "force-dynamic";

function fmtMinutes(min: number): string {
  if (!min) return "0분";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}분`;
  if (!m) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

// 헌법 v1.10 — 학습 분석. 본인 데이터 기반 차트·히트맵·KPI.
export default async function StudyAnalysisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [summary, heatmap, stats, lib] = await Promise.all([
    getDashboardSummary(user.id),
    getActivityHeatmap(user.id),
    getSessionStats(user.id),
    getLibraryCounts(user.id),
  ]);

  // 헌법 v2.1 — KPI tone 통일 (회색). 액센트는 진척도 KPI 만.
  const kpiCards = [
    {
      label: "전체 학습 시간",
      value: fmtMinutes(stats.totalMinutes),
      sub: `${stats.sessions}회 세션`,
      Icon: Activity,
    },
    {
      label: "평균 정답률",
      value: `${stats.avgAccuracy}%`,
      sub: "전체 세션 누적",
      Icon: Target,
    },
    {
      label: "학습 카드",
      value: `${stats.totalCards}장`,
      sub: `학습 ${lib.study} · 오답 ${lib.mistakes} · 어휘 ${lib.vocab}`,
      Icon: Layers,
    },
  ];

  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="학습 분석"
        subtitle="본인 학습 기록의 추이·취약점·활동량을 한눈에 분석합니다."
      />
      <div className="px-6 space-y-3">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {kpiCards.map(({ label, value, sub, Icon }) => (
            <Card key={label} className="border-rule">
              <CardContent className="p-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-2 font-serif text-2xl font-medium leading-none tracking-tight num">
                    {value}
                  </p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {sub}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground"
                >
                  <Icon className="h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <div className="xl:col-span-2">
            <LearningTrend data={summary.trend} />
          </div>
          <div>
            <WeakTypes items={summary.weakTypes} />
          </div>
        </section>

        <Card className="border-rule">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-medium tracking-tight">활동량 (최근 12주)</h2>
              <span className="text-[11px] text-muted-foreground">
                매일 학습 시간(분) 기준
              </span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <ActivityHeatmap cells={heatmap} />
            </div>
            <p className="mt-2 text-[10.5px] text-muted-foreground">
              헌법 제8조(도파민 트리거) — 매일의 학습이 그래프 한 칸으로 누적됩니다.
            </p>
          </CardContent>
        </Card>

        <p className="text-[10.5px] text-muted-foreground">
          본 분석은 <strong>본인 계정의 실제 학습 기록</strong>으로 산출됩니다 (헌법
          v1.10 · 제13조의2).
        </p>
      </div>
    </div>
  );
}

// Cloudflare Pages — Edge runtime (헌법 v2.1 + 제17조 5항 정합)
export const runtime = "edge";
