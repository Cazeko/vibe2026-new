import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  UserCircle,
  Settings,
  Trophy,
  Target,
  Clock,
  Flame,
  CheckCircle2,
  BookOpen,
  Layers,
  RefreshCw,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityHeatmap } from "@/components/feature/analysis/activity-heatmap";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { getDashboardSummary } from "@/lib/dashboard/queries";
import {
  getActivityHeatmap,
  getSessionStats,
  getLibraryCounts,
  getRecentActivity,
} from "@/lib/dashboard/analytics";

export const dynamic = "force-dynamic";

const SHORT_NAME: Record<string, string> = {
  한양: "한양대",
  중앙: "중앙대",
  성균관: "성균관대",
  경희: "경희대",
  이화: "이화여대",
  서강: "서강대",
  홍익: "홍익대",
  동국: "동국대",
  건국: "건국대",
  숭실: "숭실대",
};

const MODE_LABEL: Record<string, string> = {
  vocab: "어휘 SRS",
  exam: "기출 풀이",
  review: "오답 복습",
};

const MODE_ICON = {
  vocab: BookOpen,
  exam: Layers,
  review: RefreshCw,
} as const;

function fmtMinutes(min: number): string {
  if (!min) return "0분";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}분`;
  if (!m) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

type Badge = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  Icon: typeof Trophy;
};

function computeBadges(args: {
  streak: number;
  totalMinutes: number;
  totalCards: number;
  hasTarget: boolean;
}): Badge[] {
  return [
    {
      id: "first-step",
      title: "첫 발걸음",
      description: "첫 학습 세션 완료",
      earned: args.totalMinutes > 0,
      Icon: CheckCircle2,
    },
    {
      id: "target-set",
      title: "목표 설정",
      description: "목표 학교를 선택했습니다",
      earned: args.hasTarget,
      Icon: Target,
    },
    {
      id: "streak-3",
      title: "3일 연속",
      description: "3일 연속 학습 달성",
      earned: args.streak >= 3,
      Icon: Flame,
    },
    {
      id: "streak-7",
      title: "1주 연속",
      description: "7일 연속 학습 달성",
      earned: args.streak >= 7,
      Icon: Flame,
    },
    {
      id: "minutes-300",
      title: "5시간 돌파",
      description: "누적 학습 5시간 돌파",
      earned: args.totalMinutes >= 300,
      Icon: Clock,
    },
    {
      id: "cards-100",
      title: "100장 마스터",
      description: "카드 100장 복습 완료",
      earned: args.totalCards >= 100,
      Icon: Trophy,
    },
  ];
}

// 헌법 v1.10 — 마이 페이지. 프로필·통계·뱃지·활동 히트맵·최근 활동.
export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = getDb();
  const [profileRow] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  const [summary, heatmap, stats, lib, recent] = await Promise.all([
    getDashboardSummary(user.id),
    getActivityHeatmap(user.id),
    getSessionStats(user.id),
    getLibraryCounts(user.id),
    getRecentActivity(user.id, 6),
  ]);

  const target = profileRow?.targetUniversity ?? null;
  const targetShort = target
    ? (SHORT_NAME[target] ?? `${target}대`)
    : null;
  const examDate = profileRow?.examDate ?? null;
  const daysToExam = summary.kpi.daysToExam;

  const badges = computeBadges({
    streak: summary.kpi.streakDays,
    totalMinutes: stats.totalMinutes,
    totalCards: stats.totalCards,
    hasTarget: !!target,
  });
  const earnedCount = badges.filter((b) => b.earned).length;

  // 헌법 v2.1 — KPI 톤 통일.
  const statTiles = [
    { label: "전체 학습", value: fmtMinutes(stats.totalMinutes), Icon: Clock },
    { label: "세션 수", value: `${stats.sessions}회`, Icon: Activity },
    { label: "평균 정답률", value: `${stats.avgAccuracy}%`, Icon: Target },
    { label: "복습 카드", value: `${stats.totalCards}장`, Icon: Layers },
  ];

  return (
    <div className="min-h-screen pb-10">
      <PageHeader title="마이 페이지" subtitle="프로필과 학습 기록을 한 페이지에 모았습니다." />
      <div className="px-6 space-y-3">
        {/* 프로필 + 목표 */}
        <Card className="border-rule">
          <CardContent className="p-5 flex items-center gap-4 flex-wrap">
            <span
              aria-hidden
              className="grid h-16 w-16 place-items-center rounded-lg bg-evergreen text-primary-foreground"
            >
              <UserCircle className="h-9 w-9" />
            </span>
            <div className="flex-1 min-w-[200px]">
              <p className="font-serif text-lg font-medium truncate">
                {user.email ?? "Fitly 학습자"}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                목표 {targetShort ?? "미설정"}
                {examDate && ` · 시험일 ${examDate}`}
                {daysToExam != null && ` (D-${daysToExam})`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/settings">
                  <Settings className="h-4 w-4" aria-hidden />
                  설정 변경
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/study/exam">학습 시작</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 통계 4 */}
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {statTiles.map(({ label, value, Icon }) => (
            <Card key={label} className="border-rule">
              <CardContent className="p-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-2 font-serif text-2xl font-medium leading-none tracking-tight num">{value}</p>
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

        {/* 카드 라이브러리 (3종) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-rule">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-medium tracking-tight">학습 카드</h2>
                <Link
                  href="/study/exam"
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  풀기 ›
                </Link>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <p className="font-serif text-3xl font-medium tracking-tight num">
                  {lib.study}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">장</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  복습 대기 <strong>{lib.studyDue}</strong>
                </p>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                내 자료 추출 (제13조의2)
              </p>
            </CardContent>
          </Card>
          <Card className="border-rule">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-medium tracking-tight">오답 카드</h2>
                <Link
                  href="/mistakes"
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  열기 ›
                </Link>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <p className="font-serif text-3xl font-medium tracking-tight num">
                  {lib.mistakes}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">장</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  복습 대기 <strong>{lib.mistakesDue}</strong>
                </p>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                내가 틀린 문제
              </p>
            </CardContent>
          </Card>
          <Card className="border-rule">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-medium tracking-tight">어휘 카드</h2>
                <Link
                  href="/study/vocab"
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  학습 ›
                </Link>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <p className="font-serif text-3xl font-medium tracking-tight num">
                  {lib.vocab}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">장</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  복습 대기 <strong>{lib.vocabDue}</strong>
                </p>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                편입 빈출 어휘
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 뱃지 */}
        <Card className="border-rule">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-medium tracking-tight">획득 뱃지</h2>
              <span className="text-[11px] text-muted-foreground">
                {earnedCount}/{badges.length}
              </span>
            </div>
            <ul className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
              {badges.map((b) => (
                <li
                  key={b.id}
                  className={`rounded-lg border px-3 py-3 text-center transition-colors ${
                    b.earned
                      ? "border-warning/40 bg-warning/[0.06]"
                      : "border-rule bg-background opacity-60"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`mx-auto grid h-8 w-8 place-items-center rounded-md ${
                      b.earned
                        ? "bg-warning/15 text-warning"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <b.Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-1.5 text-[12px] font-semibold">{b.title}</p>
                  <p className="text-[10px] text-muted-foreground">{b.description}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 히트맵 + 최근 활동 */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          <Card className="xl:col-span-2 border-rule">
            <CardContent className="p-4">
              <h2 className="font-serif text-lg font-medium tracking-tight">활동량 (최근 12주)</h2>
              <div className="mt-3 overflow-x-auto">
                <ActivityHeatmap cells={heatmap} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-rule">
            <CardContent className="p-4">
              <h2 className="font-serif text-lg font-medium tracking-tight">최근 학습</h2>
              {recent.length === 0 ? (
                <p className="mt-3 text-[12px] text-muted-foreground">
                  학습 세션이 누적되면 여기에 표시됩니다.
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {recent.map((r) => {
                    const Icon =
                      MODE_ICON[r.mode as keyof typeof MODE_ICON] ?? Activity;
                    return (
                      <li
                        key={r.id}
                        className="flex items-center gap-2.5 rounded-lg border border-rule bg-background px-2.5 py-2"
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-secondary text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium">
                            {MODE_LABEL[r.mode] ?? r.mode}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {fmtMinutes(r.durationMinutes)} · {r.cards}장
                            {r.accuracy != null && ` · ${r.accuracy}%`}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(r.startedAt)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

