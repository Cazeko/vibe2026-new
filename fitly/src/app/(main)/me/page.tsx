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
  Pencil,
  Calendar,
  TrendingUp,
  Headphones,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
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

const REGION_SHORT: Record<string, string> = {
  서울: "서울", 경기: "경기", 인천: "인천", 부산: "부산", 대구: "대구",
  광주: "광주", 대전: "대전", 울산: "울산", 세종: "세종", 강원: "강원",
  충북: "충북", 충남: "충남", 전북: "전북", 전남: "전남", 경북: "경북",
  경남: "경남", 제주: "제주",
};

const MODE_LABEL: Record<string, string> = {
  quiz: "풀이",
  keyword: "키워드 학습",
  mistake: "오답 복습",
  exam: "기출 풀이",
  review: "오답 복습",
};

const MODE_ICON = {
  quiz: Layers,
  keyword: BookOpen,
  mistake: RefreshCw,
  exam: Layers,
  review: RefreshCw,
  podcast: Headphones,
  analysis: TrendingUp,
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
  if (d < 7) return `${d}일 전`;
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
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
      description: "지역 교육청 선택",
      earned: args.hasTarget,
      Icon: Target,
    },
    {
      id: "streak-3",
      title: "3일 연속",
      description: "연속 학습 3일",
      earned: args.streak >= 3,
      Icon: Flame,
    },
    {
      id: "streak-7",
      title: "1주 연속",
      description: "한 주를 채우면",
      earned: args.streak >= 7,
      Icon: Calendar,
    },
    {
      id: "minutes-300",
      title: "5시간 돌파",
      description: "누적 학습 5시간",
      earned: args.totalMinutes >= 300,
      Icon: Clock,
    },
    {
      id: "cards-100",
      title: "100장 마스터",
      description: "카드 100장 복습",
      earned: args.totalCards >= 100,
      Icon: Trophy,
    },
  ];
}

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
    getRecentActivity(user.id, 5),
  ]);

  const target = profileRow?.targetUniversity ?? null;
  const targetShort = target ? (REGION_SHORT[target] ?? target) : null;
  const daysToExam = summary.kpi.daysToExam;
  const joinedAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : null;

  const badges = computeBadges({
    streak: summary.kpi.streakDays,
    totalMinutes: stats.totalMinutes,
    totalCards: stats.totalCards,
    hasTarget: !!target,
  });
  const earnedCount = badges.filter((b) => b.earned).length;

  const accuracy = stats.avgAccuracy;
  const features = [
    {
      title: "풀이 트랙",
      href: "/study/quiz",
      value: lib.quiz,
      unit: "문항",
      footL: (
        <>
          정답률 <b className="text-foreground font-semibold">{accuracy}%</b>
        </>
      ),
      footR: lib.quizDue > 0 ? `복습 대기 ${lib.quizDue}` : "오늘 due 0",
      isZero: lib.quiz === 0,
    },
    {
      title: "키워드 트랙",
      href: "/study/keyword",
      value: lib.keyword,
      unit: "개념",
      footL: (
        <>
          오늘 due <b className="text-foreground font-semibold">{lib.keywordDue}</b>
        </>
      ),
      footR: lib.keyword === 0 ? "아직 시작 전" : "개념 정리 노트",
      isZero: lib.keyword === 0,
    },
    {
      title: "오답 노트",
      href: "/study/mistake",
      value: lib.mistake,
      unit: "문항",
      footL: (
        <>
          다시보기 대기 <b className="text-foreground font-semibold">{lib.mistakeDue}</b>
        </>
      ),
      footR: lib.mistake === 0 ? "again/hard 자동 합류" : "오답 복습",
      isZero: lib.mistake === 0,
    },
  ];

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="마이 페이지"
        subtitle="프로필과 학습 기록을 한 페이지에 모았습니다."
      />
      <div className="grid gap-[22px] px-10 py-7">
        {/* ─ 프로필 카드 ─ */}
        <article className="rounded-card border border-rule bg-cream-soft px-6 py-[22px] flex items-center gap-5 flex-wrap">
          <span
            aria-hidden
            className="grid h-16 w-16 shrink-0 place-items-center rounded-[14px] bg-evergreen text-gold"
          >
            <UserCircle className="h-7 w-7" />
          </span>
          <div className="flex-1 min-w-[200px]">
            <p className="font-sans text-[17px] font-bold tracking-[-0.02em] text-foreground break-all">
              {user.email ?? "Fitly 학습자"}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground tracking-[-0.005em]">
              2026학년도 1차
              {targetShort && (
                <>
                  {" · "}
                  <b className="font-semibold text-foreground">{targetShort}</b>
                </>
              )}
              {joinedAt && (
                <>
                  <span className="inline-block w-[3px] h-[3px] mx-2 align-middle rounded-full bg-rule-strong" />
                  가입일 {joinedAt}
                </>
              )}
              {daysToExam != null && (
                <>
                  <span className="inline-block w-[3px] h-[3px] mx-2 align-middle rounded-full bg-rule-strong" />
                  D−{daysToExam}
                </>
              )}
            </p>
          </div>
          <div className="inline-flex gap-2.5 flex-wrap">
            <Link
              href="/settings"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-rule-strong px-4 text-[13px] font-semibold text-ink-2 hover:border-evergreen hover:text-evergreen transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              프로필 편집
            </Link>
            <Link
              href="/settings"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-evergreen px-[18px] text-[13px] font-semibold text-white hover:bg-evergreen-strong transition-colors"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden />
              계정 설정
            </Link>
          </div>
        </article>

        {/* ─ 3 트랙 통계 ─ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-card border border-rule bg-cream-soft px-[22px] py-5"
            >
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[14.5px] font-bold tracking-[-0.02em] text-foreground">
                  {f.title}
                </span>
                <Link
                  href={f.href}
                  className="text-[12px] text-muted-foreground border-b border-rule-strong pb-px hover:text-evergreen hover:border-evergreen transition-colors"
                >
                  기록 ›
                </Link>
              </div>
              <p
                className={`font-extrabold text-[38px] leading-none tracking-[-0.03em] num inline-flex items-baseline gap-1.5 ${f.isZero ? "text-muted2-deep" : "text-foreground"}`}
              >
                {f.value}
                <span className="text-base font-medium text-muted-foreground tracking-normal">
                  {f.unit}
                </span>
              </p>
              <div className="flex items-center justify-between mt-4 text-[12px] text-muted-foreground tracking-[-0.005em]">
                <span>{f.footL}</span>
                <span>{f.footR}</span>
              </div>
            </article>
          ))}
        </section>

        {/* ─ 활동 히트맵 + 최근 활동 ─ */}
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[22px]">
          <article className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5">
            <div className="flex items-center gap-2.5">
              <h2 className="font-sans text-[17px] font-bold tracking-[-0.02em] text-foreground">
                학습 활동
              </h2>
              <span className="ml-auto text-[11.5px] text-muted-foreground">
                <b className="font-bold text-foreground">
                  {fmtMinutes(stats.totalMinutes)}
                </b>
                {" · 최근 7일"}
              </span>
            </div>
            <p className="mt-[2px] mb-[10px] text-[13px] text-muted-foreground leading-[1.5] tracking-[-0.005em]">
              최근 13주간 일별 학습 시간. 짙을수록 오래 학습한 날입니다.
            </p>
            <div className="overflow-x-auto">
              <ActivityHeatmap cells={heatmap} />
            </div>
            <div className="mt-3.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <span>적음</span>
              <i className="inline-block h-[11px] w-[11px] rounded-[3px] bg-cream-deep" />
              <i className="inline-block h-[11px] w-[11px] rounded-[3px] bg-[#d8e4dc] dark:bg-evergreen/30" />
              <i className="inline-block h-[11px] w-[11px] rounded-[3px] bg-[#9bbaa6] dark:bg-evergreen/50" />
              <i className="inline-block h-[11px] w-[11px] rounded-[3px] bg-[#5a8b71] dark:bg-evergreen/70" />
              <i className="inline-block h-[11px] w-[11px] rounded-[3px] bg-evergreen" />
              <span>많음</span>
              <span className="ml-auto">
                연속 학습{" "}
                <b className="font-bold text-foreground num">
                  {summary.kpi.streakDays}일
                </b>
                {summary.kpi.streakBest > 0 && (
                  <> · 최장 {summary.kpi.streakBest}일</>
                )}
              </span>
            </div>
          </article>

          <article className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5">
            <div className="flex items-center gap-2.5">
              <h2 className="font-sans text-[17px] font-bold tracking-[-0.02em] text-foreground">
                최근 활동
              </h2>
              <Link
                href="/study-analysis"
                className="ml-auto inline-flex items-center gap-0.5 text-[12px] text-muted2-deep border-b border-rule-strong pb-px hover:text-evergreen hover:border-evergreen transition-colors"
              >
                전체 ›
              </Link>
            </div>
            <p className="mt-[2px] mb-[10px] text-[13px] text-muted-foreground leading-[1.5] tracking-[-0.005em]">
              최근 학습 이력 {recent.length}건
            </p>
            {recent.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-muted-foreground">
                학습 세션이 누적되면 여기에 표시됩니다.
              </p>
            ) : (
              <ul className="grid gap-2">
                {recent.map((r) => {
                  const Icon =
                    MODE_ICON[r.mode as keyof typeof MODE_ICON] ?? Activity;
                  return (
                    <li
                      key={r.id}
                      className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-[10px] border border-rule bg-cream px-3.5 py-3"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-cream-deep text-evergreen">
                        <Icon className="h-[15px] w-[15px]" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold tracking-[-0.02em] truncate text-foreground">
                          {MODE_LABEL[r.mode] ?? r.mode}
                        </p>
                        <p className="text-[11.5px] text-muted-foreground mt-px">
                          {fmtMinutes(r.durationMinutes)} · {r.cards}장
                          {r.accuracy != null && ` · 정답률 ${r.accuracy}%`}
                        </p>
                      </div>
                      <span className="text-[11.5px] text-muted-foreground whitespace-nowrap num">
                        {timeAgo(r.startedAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        </section>

        {/* ─ 학습 배지 ─ */}
        <article className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5">
          <div className="flex items-center gap-2.5">
            <h2 className="font-sans text-[17px] font-bold tracking-[-0.02em] text-foreground">
              학습 배지
            </h2>
            <span className="ml-auto text-[12px] font-semibold text-muted-foreground num">
              {earnedCount} / {badges.length} 획득
            </span>
          </div>
          <p className="mt-[2px] mb-[10px] text-[13px] text-muted-foreground leading-[1.5] tracking-[-0.005em]">
            꾸준한 학습으로 배지를 모아 보세요. 모든 배지는 본인 활동 기록을
            기반으로 자동 지급됩니다.
          </p>

          <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {badges.map((b) => (
              <li
                key={b.id}
                className={`rounded-[12px] border px-3 pt-[18px] pb-3.5 text-center transition-all ${
                  b.earned
                    ? "border-gold bg-cream-soft hover:-translate-y-0.5"
                    : "border-rule bg-cream opacity-90"
                }`}
              >
                <span
                  aria-hidden
                  className={`mx-auto grid h-9 w-9 place-items-center rounded-full mb-2.5 ${
                    b.earned
                      ? "bg-gold-soft text-gold"
                      : "bg-cream-deep text-muted-foreground"
                  }`}
                >
                  <b.Icon className="h-[18px] w-[18px]" />
                </span>
                <p
                  className={`text-[13px] font-bold tracking-[-0.02em] ${b.earned ? "text-foreground" : "text-muted2-deep"}`}
                >
                  {b.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-[1.4] tracking-[-0.005em]">
                  {b.description}
                </p>
              </li>
            ))}
          </ul>
        </article>

        <p className="pt-2 max-w-[920px] text-[11.5px] text-muted-foreground leading-[1.6]">
          본 마이 페이지의 통계·배지·활동 기록은{" "}
          <strong className="font-semibold text-muted2-deep">
            본인 계정의 실제 학습 데이터
          </strong>
          만으로 산출됩니다. 합격 컷·타사용자 평균 같은 외부 비교 지표는 사용하지
          않습니다.
        </p>
      </div>
    </div>
  );
}
