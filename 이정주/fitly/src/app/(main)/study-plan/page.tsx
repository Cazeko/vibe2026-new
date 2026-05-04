import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Layers,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Circle,
  Lock,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSummary } from "@/lib/dashboard/queries";
import { getLibraryCounts } from "@/lib/dashboard/analytics";

export const dynamic = "force-dynamic";

// 헌법 v2.0 제13조 2번 — 시험일 D-day 기반 일일 목표 자동 역산.
// 보유 학습 카드를 남은 일수로 1차 분배 + 어휘·오답 권장량 가산.
function computeDailyTargets(
  lib: { study: number; vocab: number; mistakes: number },
  daysToExam: number | null,
) {
  // 시험일 미설정 시 디폴트(어휘 30 / 학습 20 / 권장 60분)
  if (daysToExam == null) {
    return {
      vocabDaily: 30,
      studyDaily: 20,
      mistakeDaily: 10,
      minutesDaily: 60,
      reason: "시험일 미설정 — 권장 기본값",
      hasExamDate: false,
    } as const;
  }

  const safeDays = Math.max(1, daysToExam);
  // 학습 카드: 보유 / 남은 일수 (각 카드 최소 1회 풀이 가정)
  const studyDaily = Math.max(5, Math.ceil(lib.study / safeDays));
  // 어휘: 30/일 베이스 + 시험 임박할수록 가산
  const vocabDaily = daysToExam > 60 ? 25 : daysToExam > 30 ? 35 : 50;
  // 오답: 보유 / (남은일수 / 2) — 누적된 오답을 시험일까지 절반 주기로 두 번 본다는 가정
  const mistakeDaily = Math.max(
    5,
    Math.ceil(lib.mistakes / Math.max(1, Math.floor(safeDays / 2))),
  );
  const minutesDaily = Math.min(
    180,
    20 + Math.round(studyDaily * 1.5 + vocabDaily * 0.5 + mistakeDaily * 1),
  );

  return {
    vocabDaily,
    studyDaily,
    mistakeDaily,
    minutesDaily,
    reason: `D-${daysToExam} 기준 자동 역산 (보유 카드 ÷ 남은 일수)`,
    hasExamDate: true,
  } as const;
}

function fmtMinutes(min: number): string {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

type StudyMode = {
  href: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  hint: string;
  tone: string;
};

const MODES: StudyMode[] = [
  {
    href: "/study/vocab",
    title: "어휘 SRS",
    description: "FSRS 간격 반복으로 핵심 어휘 누적",
    hint: "오늘 권장 30장",
    Icon: BookOpen,
    tone: "from-indigo-50 to-violet-50 dark:from-indigo-500/15 dark:to-violet-500/10",
  },
  {
    href: "/study/exam",
    title: "기출 풀이",
    description: "TOP 10 대학 출제 패턴 기반 학습",
    hint: "오늘 권장 20문제",
    Icon: Layers,
    tone: "from-emerald-50 to-cyan-50 dark:from-emerald-500/15 dark:to-cyan-500/10",
  },
  {
    href: "/study/review",
    title: "오답 복습",
    description: "내 오답 시카드를 SRS로 자동 복습",
    hint: "복습 대기 자동",
    Icon: RefreshCw,
    tone: "from-rose-50 to-amber-50 dark:from-rose-500/15 dark:to-amber-500/10",
  },
];

const STATE_ICON = {
  in_progress: Circle,
  completed: CheckCircle2,
  locked: Lock,
} as const;

const STATE_TONE = {
  in_progress: "text-primary",
  completed: "text-emerald-500",
  locked: "text-muted-foreground/60",
} as const;

// 헌법 v1.10 — 학습 플랜. 오늘의 SRS 듀카드 + 모드 진입 + 권장 카드.
export default async function StudyPlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [summary, lib] = await Promise.all([
    getDashboardSummary(user.id),
    getLibraryCounts(user.id),
  ]);

  const totalDue = lib.vocabDue + lib.mistakesDue + lib.studyDue;
  const targets = computeDailyTargets(
    { study: lib.study, vocab: lib.vocab, mistakes: lib.mistakes },
    summary.kpi.daysToExam,
  );

  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="학습 플랜"
        subtitle="시험일 기준으로 오늘 해야 할 양을 자동 계산해 드립니다."
      />
      <div className="px-6 space-y-3">
        {/* 시험일 역산 일일 목표 — v2.0 신규 */}
        <Card className="rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-sm font-bold">시험일 역산 — 오늘 목표</h2>
              {summary.kpi.daysToExam != null && (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  D-{summary.kpi.daysToExam}
                </span>
              )}
            </div>
            <ul className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              <li className="rounded-xl border border-border/50 bg-background px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">어휘</p>
                <p className="mt-0.5 text-xl font-bold tabular-nums">
                  {targets.vocabDaily}
                  <span className="ml-1 text-[11px] font-medium text-muted-foreground">장</span>
                </p>
              </li>
              <li className="rounded-xl border border-border/50 bg-background px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">학습 카드</p>
                <p className="mt-0.5 text-xl font-bold tabular-nums">
                  {targets.studyDaily}
                  <span className="ml-1 text-[11px] font-medium text-muted-foreground">장</span>
                </p>
              </li>
              <li className="rounded-xl border border-border/50 bg-background px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">오답 복습</p>
                <p className="mt-0.5 text-xl font-bold tabular-nums">
                  {targets.mistakeDaily}
                  <span className="ml-1 text-[11px] font-medium text-muted-foreground">장</span>
                </p>
              </li>
              <li className="rounded-xl border border-border/50 bg-background px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">권장 학습 시간</p>
                <p className="mt-0.5 text-xl font-bold">
                  {fmtMinutes(targets.minutesDaily)}
                </p>
              </li>
            </ul>
            <p className="mt-2 text-[10.5px] text-muted-foreground">
              {targets.reason}.{" "}
              {targets.hasExamDate
                ? "시험일이 가까워질수록 어휘 비중이 자동 증가합니다."
                : "설정 → 시험일을 등록하시면 본인 보유 카드 기준으로 자동 분배됩니다."}
            </p>
          </CardContent>
        </Card>

        {/* 듀카드 요약 */}
        <Card className="rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)] bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/15 dark:to-violet-500/10">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground">오늘의 복습 대기</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {totalDue}
                <span className="ml-1 text-base font-medium text-muted-foreground">
                  장
                </span>
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                내 자료 {lib.studyDue}장 · 어휘 {lib.vocabDue}장 · 오답 {lib.mistakesDue}장
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lib.studyDue > 0 && (
                <Button asChild size="sm" className="h-8 rounded-xl">
                  <Link href="/study/exam">
                    내 자료 {lib.studyDue}장 풀기 <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
              {lib.vocabDue > 0 && (
                <Button
                  asChild
                  size="sm"
                  variant={lib.studyDue > 0 ? "outline" : "default"}
                  className="h-8 rounded-xl"
                >
                  <Link href="/study/vocab">어휘 {lib.vocabDue}장</Link>
                </Button>
              )}
              {lib.mistakesDue > 0 && (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-xl"
                >
                  <Link href="/study/review">오답 {lib.mistakesDue}장</Link>
                </Button>
              )}
              {totalDue === 0 && (
                <Button asChild size="sm" className="h-8 rounded-xl">
                  <Link href="/study/exam">새 문제 풀기</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 모드 3 카드 */}
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MODES.map(({ href, title, description, Icon, hint, tone }) => (
            <li key={href}>
              <Link href={href} className="block">
                <Card
                  className={`rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-md bg-gradient-to-br ${tone}`}
                >
                  <CardContent className="p-5">
                    <span
                      aria-hidden
                      className="grid h-11 w-11 place-items-center rounded-xl bg-white/70 text-primary shadow-sm dark:bg-white/10"
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-base font-bold">{title}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {description}
                    </p>
                    <p className="mt-3 text-[11px] font-medium text-primary">
                      {hint} →
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>

        {/* 오늘의 플랜 (서버 계산 결과) */}
        <Card className="rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <CardContent className="p-4">
            <h2 className="text-sm font-bold">오늘의 플랜 진행도</h2>
            <ul className="mt-3 space-y-2">
              {summary.plan.map((item) => {
                const Icon = STATE_ICON[item.state];
                const tone = STATE_TONE[item.state];
                const isLocked = item.state === "locked";
                return (
                  <li key={item.id}>
                    <Link
                      href={isLocked ? "#" : item.href}
                      aria-disabled={isLocked}
                      className={`flex items-center gap-3 rounded-xl border border-border/50 bg-background px-3 py-3 transition-colors ${
                        isLocked
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:bg-secondary/40"
                      }`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${tone}`} aria-hidden />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <div className="hidden sm:block w-28 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-muted-foreground w-9 text-right">
                          {item.progress}%
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* 학습 가이드 */}
        <Card className="rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <CardContent className="p-4">
            <h2 className="text-sm font-bold">학습 가이드</h2>
            <ol className="mt-2 space-y-1.5 text-[12px] text-foreground/80 leading-relaxed list-decimal pl-4">
              <li>
                <strong>어휘 SRS</strong>를 매일 10~30장씩 꾸준히 (FSRS 간격 반복).
              </li>
              <li>
                <strong>기출 풀이</strong>로 새 문제를 풀고, 오답은 자동으로 오답 노트에
                합류합니다.
              </li>
              <li>
                <strong>오답 복습</strong>이 진짜 점수를 올립니다 — 익숙해질 때까지 반복하세요.
              </li>
              <li>
                자료 관리에서 PDF·이미지 업로드 시 시카드가 자동 생성됩니다 (제13조의2).
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
