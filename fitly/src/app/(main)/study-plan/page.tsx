import type { Metadata } from "next";
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
import { getReviewDueCardCounts } from "@/lib/db/queries";
import {
  computeKeywordDaily,
  computeMistakeDaily,
  computeMinutesDaily,
  computeQuizDaily,
} from "@/lib/study-plan/calculations";

export const dynamic = "force-dynamic";

// N1 (헌법 제24조의2 정합) — 학습 계획 페이지 메타데이터
export const metadata: Metadata = {
  title: "학습 계획 · Fitly",
  description:
    "시험일 역산으로 오늘 풀이·키워드·오답 학습량을 자동 계산해 드립니다.",
};

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
  // 코드리뷰 M21 (2026-05-15) — 매직 넘버 산식을 lib/study-plan/calculations.ts 로
  // 분리. 임계 일수·일일 목표 상수가 의미 있는 이름으로 노출되어 추후 헌법 §11
  // Progress 공식과 정합 시 단일 진입점.
  const quizDaily = computeQuizDaily(lib.quiz, daysToExam);
  const keywordDaily = computeKeywordDaily(daysToExam);
  const mistakeDaily = computeMistakeDaily(lib.mistake, daysToExam);
  const minutesDaily = computeMinutesDaily(quizDaily, keywordDaily, mistakeDaily);

  return {
    quizDaily,
    keywordDaily,
    mistakeDaily,
    minutesDaily,
    // B1 (헌법 제24조의2 정합) — 역산 산식 비노출 fix: 보유/남은 일수 동적 표기
    reason: `D-${daysToExam} 기준 자동 역산 (보유 ${lib.quiz}장 ÷ ${safeDays}일)`,
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
    description: "풀이의 ‘다시·어려움’ 자동 합류",
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

  const [summary, lib, reviewDue] = await Promise.all([
    getDashboardSummary(user.id),
    getLibraryCounts(user.id),
    // 주인님 보고 #18 (2026-05-14) — 오늘의 복습 대기는 *이미 학습 시작한* 카드
    // 중 due 도래한 것만 카운트. NEW(미학습) 시드 전체를 484장으로 잡던 회귀 해소.
    getReviewDueCardCounts(user.id),
  ]);

  const totalReviewDue = reviewDue.quiz + reviewDue.keyword + reviewDue.mistake;
  const targets = computeDailyTargets(
    { quiz: lib.quiz, keyword: lib.keyword, mistake: lib.mistake },
    summary.kpi.daysToExam,
  );

  return (
    <div className="min-h-screen pb-6 xl:h-screen xl:pb-0 xl:overflow-hidden xl:flex xl:flex-col">
      <PageHeader
        title="학습 계획"
        subtitle="시험일 기준으로 오늘 해야 할 양을 자동 계산해 드립니다."
      />
      <div className="px-4 sm:px-6 mx-auto max-w-7xl w-full space-y-3 xl:flex-1 xl:min-h-0 xl:flex xl:flex-col xl:gap-3 xl:space-y-0">
        {/* 시험일 역산 일일 목표 */}
        <Card className="border-rule shrink-0">
          <CardContent className="p-4 xl:p-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden />
              <h2 className="font-serif text-lg font-medium tracking-tight">
                시험일 역산 — 오늘 목표
              </h2>
              {summary.kpi.daysToExam != null && (
                <span className="ml-auto rounded-full bg-evergreen/10 px-2 py-0.5 text-[11px] font-semibold text-evergreen">
                  D−{summary.kpi.daysToExam}
                </span>
              )}
            </div>
            <ul className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              <li className="rounded-lg border border-rule bg-background px-3 py-2">
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
              <li className="rounded-lg border border-rule bg-background px-3 py-2">
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
              <li className="rounded-lg border border-rule bg-background px-3 py-2">
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
              <li className="rounded-lg border border-rule bg-background px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  권장 학습 시간
                </p>
                <p className="mt-0.5 font-serif text-2xl font-medium num">
                  {fmtMinutes(targets.minutesDaily)}
                </p>
              </li>
            </ul>
            <p className="mt-2 text-[10.5px] text-muted-foreground leading-[1.55]">
              {targets.reason}.{" "}
              {targets.hasExamDate
                ? "시험일이 가까워질수록 키워드 비중이 자동 증가합니다."
                : "설정에서 시험일을 등록하시면 본인 보유 카드 기준으로 자동 분배됩니다."}
            </p>
          </CardContent>
        </Card>

        {/* 주인님 보고 #10 (2026-05-14) — 트랙 3 카드 + 오늘의 복습 대기 1 카드를
            한 줄로 통합. 동일 크기, 핸드폰/태블릿/PC 반응형. xl+ 에서는 전체
            페이지가 한 화면(스크롤 없음) 안에 들어가도록 flex-1 영역 차지. */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 xl:flex-1 xl:min-h-0">
          {/* 오늘의 복습 대기 — 가장 좌측에 배치, evergreen 강조 보존 */}
          <Card className="border-evergreen bg-evergreen/[0.06] flex flex-col">
            <CardContent className="p-4 xl:p-3 flex flex-col flex-1 min-h-0">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                오늘의 복습 대기
              </p>
              <p className="mt-1 font-serif text-evergreen text-3xl font-medium tracking-tight num">
                {totalReviewDue > 0 ? totalReviewDue : "—"}
                {totalReviewDue > 0 && (
                  <span className="ml-1 text-base font-sans font-normal text-muted-foreground">
                    장
                  </span>
                )}
              </p>
              <p className="mt-1 text-[11.5px] text-muted-foreground leading-[1.5]">
                {totalReviewDue > 0 ? (
                  <>
                    풀이 {reviewDue.quiz}장 · 키워드 {reviewDue.keyword}장 ·
                    오답 {reviewDue.mistake}장
                  </>
                ) : (
                  <>복습 대기 없음 — 새 카드를 학습하시면 복습 큐가 형성됩니다.</>
                )}
              </p>
              <div className="mt-auto pt-3">
                <Button asChild size="sm" className="h-8 rounded-lg w-full">
                  <Link href="/study/quiz">
                    학습 시작 <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {MODES.map(({ href, title, description, Icon, hint }) => (
            <Link
              key={title}
              href={href}
              className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule-strong/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card className="border-rule h-full transition-colors duration-150 ease-out hover:border-rule-strong flex flex-col">
                <CardContent className="p-4 xl:p-3 flex flex-col flex-1 min-h-0">
                  <span
                    aria-hidden
                    className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-foreground"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 font-serif text-base font-medium tracking-tight">
                    {title}
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted-foreground leading-[1.5]">
                    {description}
                  </p>
                  <p className="mt-auto pt-2 text-[11px] font-medium text-evergreen">
                    {hint} →
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        {/* 진행도 + 학습 가이드 — xl+ 좌우 2열로 viewport 안에 정합. */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 shrink-0">
          {/* 오늘의 플랜 진행도 */}
          <Card className="border-rule">
            <CardContent className="p-4 xl:p-3">
              <h2 className="font-serif text-base font-medium tracking-tight">
                오늘의 플랜 진행도
              </h2>
              <ul className="mt-2 -mx-4 xl:-mx-3 divide-y divide-rule border-y border-rule">
                {summary.plan.map((item) => {
                  const Icon = STATE_ICON[item.state];
                  const tone = STATE_TONE[item.state];
                  const isLocked = item.state === "locked";
                  // 주인님 보고 #21 (2026-05-14) — subtitle 의 "N장 due 예정"
                  // 류 문구에서 due 영문을 한글로. F9 사후 리뷰 (2026-05-15) —
                  // /due/gi 가 dueDate 류 substring 까지 치환하던 회귀 회피로
                  // word-boundary /\bdue\b/gi 로 좁힌다.
                  const subtitle = item.subtitle
                    .replace(/\bdue\b/gi, "복습")
                    .replace(/\bAgain\b/gi, "다시")
                    .replace(/\bHard\b/gi, "어려움");
                  return (
                    <li key={item.id}>
                      <Link
                        href={isLocked ? "#" : item.href}
                        aria-disabled={isLocked}
                        className={`flex items-center gap-3 px-4 py-2 transition-colors duration-150 ease-out ${
                          isLocked
                            ? "opacity-60 cursor-not-allowed"
                            : "hover:bg-secondary/40"
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${tone}`} aria-hidden />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-medium truncate">
                            {item.title}
                          </p>
                          <p className="text-[10.5px] text-muted-foreground mt-0.5 truncate">
                            {subtitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] shrink-0">
                          <div className="hidden md:block w-16 lg:w-20 h-1.5 overflow-hidden rounded-full bg-rule">
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

          {/* 학습 가이드 — 주인님 보고 #9 (2026-05-14): 팟캐스트 단어의 밑줄·색을
              제거하고 형광펜 칠로 변경. 색은 검정 유지. */}
          <Card className="border-rule">
            <CardContent className="p-4 xl:p-3">
              <h2 className="font-serif text-base font-medium tracking-tight">
                학습 가이드
              </h2>
              <ol className="mt-2 space-y-1.5 text-[12px] text-foreground/80 leading-relaxed list-decimal pl-4">
                <li>
                  <strong>풀이 트랙</strong>
                  {reviewDue.quiz > 0 && (
                    <span className="ml-1 text-evergreen font-medium num">
                      (오늘 {reviewDue.quiz}장 추천)
                    </span>
                  )}{" "}
                  — 서술형 기출에 답안을 작성하고 AI 모범답안과 비교, 자가 채점합니다.
                </li>
                <li>
                  <strong>키워드 트랙</strong>
                  {reviewDue.keyword > 0 && (
                    <span className="ml-1 text-evergreen font-medium num">
                      (오늘 {reviewDue.keyword}장 추천)
                    </span>
                  )}{" "}
                  — 개념 정리 노트로 정의·핵심 요소를 반복 학습합니다.
                </li>
                <li>
                  <strong>오답 트랙</strong>
                  {reviewDue.mistake > 0 && (
                    <span className="ml-1 text-evergreen font-medium num">
                      (오늘 {reviewDue.mistake}장 추천)
                    </span>
                  )}{" "}
                  — 풀이를 ‘다시·어려움’으로 평가하면 자동 합류, 마스터까지 반복합니다.
                </li>
                <li>
                  <Link
                    href="/podcast"
                    className="font-bold text-foreground bg-gold-soft/55 dark:bg-gold-soft/30 px-1 py-px rounded-sm hover:bg-gold-soft/80 transition-colors no-underline"
                  >
                    팟캐스트
                  </Link>{" "}
                  — 영역·연도·주제 선택 후 2인 화자 대화체 팟캐스트로 자동 생성,
                  이동 중에도 청취 학습.
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
