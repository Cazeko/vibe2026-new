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

// 헌법 v3.0 제13조 6번 — 학습 계획 페이지: D-day 카운트다운 + 페이스 토글.
// 일정은 SRS 자동 산출, 사용자는 페이스만 선택 (가벼움/표준/집중).
function computeDailyTargets(
  lib: { quiz: number; keyword: number; mistake: number },
  daysToExam: number | null,
) {
  if (daysToExam == null) {
    return {
      quizDaily: 5,
      keywordDaily: 20,
      mistakeDaily: 5,
      minutesDaily: 60,
      reason: "시험일 미설정 — 권장 기본값",
      hasExamDate: false,
    } as const;
  }

  const safeDays = Math.max(1, daysToExam);
  const quizDaily = Math.max(3, Math.ceil(lib.quiz / safeDays));
  const keywordDaily = daysToExam > 60 ? 15 : daysToExam > 30 ? 25 : 40;
  const mistakeDaily = Math.max(
    3,
    Math.ceil(lib.mistake / Math.max(1, Math.floor(safeDays / 2))),
  );
  const minutesDaily = Math.min(
    180,
    20 + Math.round(quizDaily * 4 + keywordDaily * 0.5 + mistakeDaily * 2),
  );

  return {
    quizDaily,
    keywordDaily,
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
};

// 헌법 v3.0 제13조 — 학습 페이지의 3 트랙 SRS 큐 (풀이/키워드/오답).
const MODES: StudyMode[] = [
  {
    href: "/study/quiz",
    title: "풀이 트랙",
    description: "서술형 기출 (2014~2026) — 답안 작성 + AI 모범답안 비교",
    hint: "오늘 권장 자동",
    Icon: Layers,
  },
  {
    href: "/study/keyword",
    title: "키워드 트랙",
    description: "개념 정리 노트 — 정의·핵심 요소·출제 이력",
    hint: "오늘 권장 자동",
    Icon: BookOpen,
  },
  {
    href: "/study/mistake",
    title: "오답 트랙",
    description: "풀이의 again/hard 자동 합류",
    hint: "복습 대기 자동",
    Icon: RefreshCw,
  },
];

const STATE_ICON = {
  in_progress: Circle,
  completed: CheckCircle2,
  locked: Lock,
} as const;

const STATE_TONE = {
  in_progress: "text-muted-foreground",
  completed: "text-evergreen",
  locked: "text-muted-foreground/40",
} as const;

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

  const totalDue = lib.quizDue + lib.keywordDue + lib.mistakeDue;
  const targets = computeDailyTargets(
    { quiz: lib.quiz, keyword: lib.keyword, mistake: lib.mistake },
    summary.kpi.daysToExam,
  );

  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="학습 계획"
        subtitle="시험일 기준으로 오늘 해야 할 양을 자동 계산해 드립니다."
      />
      <div className="px-6 mx-auto max-w-7xl space-y-3">
        {/* 시험일 역산 일일 목표 */}
        <Card className="border-rule">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-evergreen" aria-hidden />
              <h2 className="font-serif text-lg font-medium tracking-tight">
                시험일 역산 — 오늘 목표
              </h2>
              {summary.kpi.daysToExam != null && (
                <span className="ml-auto rounded-full bg-evergreen/10 px-2 py-0.5 text-[11px] font-semibold text-evergreen">
                  D-{summary.kpi.daysToExam}
                </span>
              )}
            </div>
            <ul className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              <li className="rounded-lg border border-rule bg-background px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  풀이
                </p>
                <p className="mt-0.5 font-serif text-2xl font-medium num">
                  {targets.quizDaily}
                  <span className="ml-1 text-[11px] font-sans font-normal text-muted-foreground">
                    장
                  </span>
                </p>
              </li>
              <li className="rounded-lg border border-rule bg-background px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  키워드
                </p>
                <p className="mt-0.5 font-serif text-2xl font-medium num">
                  {targets.keywordDaily}
                  <span className="ml-1 text-[11px] font-sans font-normal text-muted-foreground">
                    장
                  </span>
                </p>
              </li>
              <li className="rounded-lg border border-rule bg-background px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  오답 복습
                </p>
                <p className="mt-0.5 font-serif text-2xl font-medium num">
                  {targets.mistakeDaily}
                  <span className="ml-1 text-[11px] font-sans font-normal text-muted-foreground">
                    장
                  </span>
                </p>
              </li>
              <li className="rounded-lg border border-rule bg-background px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  권장 학습 시간
                </p>
                <p className="mt-0.5 font-serif text-2xl font-medium num">
                  {fmtMinutes(targets.minutesDaily)}
                </p>
              </li>
            </ul>
            <p className="mt-2 text-[10.5px] text-muted-foreground">
              {targets.reason}.{" "}
              {targets.hasExamDate
                ? "시험일이 가까워질수록 키워드 비중이 자동 증가합니다."
                : "설정에서 시험일을 등록하시면 본인 보유 카드 기준으로 자동 분배됩니다."}
            </p>
          </CardContent>
        </Card>

        {/* 듀카드 요약 */}
        <Card className="border-evergreen bg-evergreen/[0.06]">
          <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                오늘의 복습 대기
              </p>
              <p className="mt-1 font-serif text-evergreen text-3xl font-medium tracking-tight num">
                {totalDue}
                <span className="ml-1 text-base font-sans font-normal text-muted-foreground">
                  장
                </span>
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                풀이 {lib.quizDue}장 · 키워드 {lib.keywordDue}장 · 오답 {lib.mistakeDue}장
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="h-8 rounded-lg">
                <Link href="/study/quiz">
                  학습 시작 <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 모드 3 카드 */}
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MODES.map(({ href, title, description, Icon, hint }) => (
            <li key={title}>
              <Link href={href} className="block">
                <Card className="border-rule transition-all hover:border-rule-strong hover:-translate-y-0.5">
                  <CardContent className="p-5">
                    <span
                      aria-hidden
                      className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-foreground"
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 font-serif text-lg font-medium">{title}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {description}
                    </p>
                    <p className="mt-3 text-[11px] font-medium text-evergreen">
                      {hint} →
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>

        {/* 오늘의 플랜 진행도 */}
        <Card className="border-rule">
          <CardContent className="p-5">
            <h2 className="font-serif text-lg font-medium tracking-tight">
              오늘의 플랜 진행도
            </h2>
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
                      className={`flex items-center gap-3 rounded-lg border border-rule bg-background px-3 py-3 transition-colors ${
                        isLocked
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:bg-secondary"
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
                        <div className="hidden sm:block w-28 h-1.5 overflow-hidden rounded-full bg-rule">
                          <div
                            className="h-full bg-evergreen gauge-fill"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="num text-muted-foreground w-9 text-right">
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

        {/* 학습 가이드 — v3.0 */}
        <Card className="border-rule">
          <CardContent className="p-5">
            <h2 className="font-serif text-lg font-medium tracking-tight">
              학습 가이드
            </h2>
            <ol className="mt-2 space-y-1.5 text-[12px] text-foreground/80 leading-relaxed list-decimal pl-4">
              <li>
                <strong>풀이 트랙</strong> — 서술형 기출에 답안을 작성하고 AI 모범답안과
                비교, 자가 채점합니다.
              </li>
              <li>
                <strong>키워드 트랙</strong> — 개념 정리 노트로 정의·핵심 요소를
                반복 학습합니다 (객관식 시대 데이터 포함).
              </li>
              <li>
                <strong>오답 트랙</strong> — 풀이를 다시/어렵으로 평가하면 자동 합류,
                마스터될 때까지 반복합니다.
              </li>
              <li>
                <strong>
                  <Link
                    href="/podcast"
                    className="text-evergreen hover:underline underline-offset-2"
                  >
                    팟캐스트 →
                  </Link>
                </strong>{" "}
                영역·연도·주제 선택 후 2인 화자 대화체 팟캐스트로 자동 생성,
                이동 중에도 청취 학습.
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
