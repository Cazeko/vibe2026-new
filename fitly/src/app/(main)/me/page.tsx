import type { Metadata } from "next";
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
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { getDashboardSummary } from "@/lib/dashboard/queries";
import {
  getSessionStats,
  getLibraryCounts,
  getRecentActivity,
} from "@/lib/dashboard/analytics";

export const dynamic = "force-dynamic";

// N1 (헌법 제24조의2 정합) — 마이 페이지 메타데이터
export const metadata: Metadata = {
  title: "마이 페이지 · Fitly",
  description:
    "프로필·3 트랙 통계·학습 활동 히트맵·배지 등 본인 학습 기록을 한 페이지에 모았습니다.",
};

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

  // O2 (헌법 제24조의2 정합) — 프로필 + 분석 4종 병렬 fetch.
  // 사용자 보고 2026-05-12 — heatmap 카드 제거로 getActivityHeatmap fetch 도 제거.
  const db = getDb();
  const [profileRows, summary, stats, lib, recent] = await Promise.all([
    db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1),
    getDashboardSummary(user.id),
    getSessionStats(user.id),
    getLibraryCounts(user.id),
    getRecentActivity(user.id, 5),
  ]);
  const profileRow = profileRows[0];

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
    // 사용자 보고 2026-05-12 — 마이페이지 viewport fit. 학습 활동 히트맵 카드는
    // 마이페이지에서 제거 (학습 분석 페이지에서 1년 단위로 확인 가능 — 중복 회피).
    // P0-12 (외부 평가 2026-05-12) — viewport-fit 임계점 lg → xl 상향.
    // 1024~1279 좁은 데스크톱에서 flex-1 분배 잔여공간 부족으로 카드 겹침 발생.
    // xl+(≥1280) 에서만 viewport fit, 좁은 화면은 자연 스크롤 fallback.
    <div className="min-h-screen pb-12 xl:h-screen xl:pb-0 xl:overflow-hidden xl:flex xl:flex-col">
      <PageHeader
        title="마이 페이지"
        subtitle="프로필과 학습 기록을 한 페이지에 모았습니다."
      />
      <div className="grid gap-[22px] px-10 py-7 xl:flex xl:flex-col xl:gap-3 xl:px-8 xl:py-4 xl:flex-1 xl:min-h-0">
        {/* ─ 프로필 카드 ─ */}
        <article className="rounded-card border border-rule bg-cream-soft px-6 py-[22px] xl:px-5 xl:py-3 flex items-center gap-5 xl:gap-4 flex-wrap shrink-0">
          <span
            aria-hidden
            className="grid h-16 w-16 shrink-0 place-items-center rounded-[14px] bg-evergreen text-gold"
          >
            <UserCircle className="h-7 w-7" />
          </span>
          <div className="flex-1 min-w-[200px]">
            {/* B2 (헌법 제24조의2 정합) — 긴 이메일 truncate 시 title로 hover 표시 */}
            <p
              className="font-sans text-[17px] font-bold tracking-[-0.02em] text-foreground break-all"
              title={user.email ?? undefined}
            >
              {user.email ?? "Fitly 선생님"}
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
          {/* G2 (헌법 제24조의2 정합) — focus-visible ring 추가. evergreen은 CTA(계정 설정)에만, 일반은 rule-strong */}
          <div className="inline-flex gap-2.5 flex-wrap">
            <Link
              href="/settings"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-rule-strong px-4 text-[13px] font-semibold text-ink-2 hover:border-evergreen hover:text-evergreen transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule-strong/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              프로필 편집
            </Link>
            <Link
              href="/settings"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-evergreen px-[18px] text-[13px] font-semibold text-white hover:bg-evergreen-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden />
              계정 설정
            </Link>
          </div>
        </article>

        {/* ─ 3 트랙 통계 ─ A1 (헌법 제24조의2 정합): md:2 lg:3 단계화
            P0-12 — 카드 내부 컴팩트 padding 도 xl 임계로 통일. */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-card border border-rule bg-cream-soft px-[22px] py-5 xl:px-4 xl:py-3"
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
              {/* C2 (헌법 제24조의2·제3조의2 정합) — lib===0 시 단독 "0" 대신 "—" 노출 */}
              <p
                className={`font-extrabold text-[38px] leading-none tracking-[-0.03em] num inline-flex items-baseline gap-1.5 ${f.isZero ? "text-muted2-deep" : "text-foreground"}`}
              >
                {f.isZero ? "—" : f.value}
                {!f.isZero && (
                  <span className="text-base font-medium text-muted-foreground tracking-normal">
                    {f.unit}
                  </span>
                )}
              </p>
              <div className="flex items-center justify-between mt-4 text-[12px] text-muted-foreground tracking-[-0.005em]">
                <span>{f.footL}</span>
                <span>{f.footR}</span>
              </div>
            </article>
          ))}
        </section>

        {/* ─ 최근 활동 + 학습 배지 ─ 좌우 분배 (xl+ 에서 viewport fit 시 잔여 공간 차지)
            사용자 보고 2026-05-12 — 학습 활동 히트맵 카드 제거 (학습 분석 페이지의
            1년 히트맵으로 일원화, 중복 회피). 그 자리를 최근 활동 + 배지가 차지.
            P0-12 (외부 평가 2026-05-12) — 컬럼 분할 임계도 xl 로 통일 (lg 1024
            ~ 1279 사이에서 좌우 분할 시 콘텐츠가 좌측 ~430·우측 ~600px 컬럼에
            압축되어 배지 grid 가 한 줄 안에 못 들어가는 문제). */}
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-3 xl:flex-1 xl:min-h-0">
          <article className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5 xl:px-5 xl:pt-4 xl:pb-3 flex flex-col">
            <div className="flex items-center gap-2.5 shrink-0">
              <h2 className="font-sans text-[15px] font-bold tracking-[-0.02em] text-foreground">
                최근 활동
              </h2>
              <Link
                href="/study-analysis"
                className="ml-auto inline-flex items-center gap-0.5 text-[12px] text-muted2-deep border-b border-rule-strong pb-px hover:text-evergreen hover:border-evergreen transition-colors"
              >
                전체 ›
              </Link>
            </div>
            <p className="mt-0.5 mb-2 text-[11.5px] text-muted-foreground leading-[1.45] tracking-[-0.005em] shrink-0">
              최근 학습 이력 {recent.length}건 · 연속 학습{" "}
              <b className="font-bold text-foreground num">
                {summary.kpi.streakDays}일
              </b>
              {summary.kpi.streakBest > 0 && (
                <> · 최장 {summary.kpi.streakBest}일</>
              )}
            </p>
            {recent.length === 0 ? (
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                학습 세션이 누적되면 여기에 표시됩니다.
              </p>
            ) : (
              <ul className="grid gap-1.5 flex-1 min-h-0 overflow-y-auto">
                {recent.map((r) => {
                  const Icon =
                    MODE_ICON[r.mode as keyof typeof MODE_ICON] ?? Activity;
                  return (
                    <li
                      key={r.id}
                      className="grid grid-cols-[28px_1fr_auto] items-center gap-2.5 rounded-[10px] border border-rule bg-cream px-3 py-2"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-cream-deep text-evergreen">
                        <Icon className="h-[14px] w-[14px]" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold tracking-[-0.02em] truncate text-foreground">
                          {MODE_LABEL[r.mode] ?? r.mode}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-px">
                          {fmtMinutes(r.durationMinutes)} · {r.cards}장
                          {r.accuracy != null && ` · 정답률 ${r.accuracy}%`}
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap num">
                        {timeAgo(r.startedAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          {/* ─ 학습 배지 ─ 최근 활동 옆 (xl+ 좌우 grid 두번째 셀) */}
          <article className="rounded-card border border-rule bg-cream-soft px-[22px] pt-[22px] pb-5 xl:px-5 xl:pt-4 xl:pb-3 flex flex-col">
            <div className="flex items-center gap-2.5 shrink-0">
              <h2 className="font-sans text-[15px] font-bold tracking-[-0.02em] text-foreground">
                학습 배지
              </h2>
              <span className="ml-auto text-[11.5px] font-semibold text-muted-foreground num">
                {earnedCount} / {badges.length} 획득
              </span>
            </div>
            <p className="mt-0.5 mb-2.5 text-[11.5px] text-muted-foreground leading-[1.45] tracking-[-0.005em] break-keep shrink-0">
              꾸준한 학습으로 배지를 모아 보세요.
            </p>

            {/* A1 (헌법 제24조의2 정합) — 배지 grid 단계화: 2→3→4→6 */}
            <ul
              aria-live="polite"
              aria-label={`학습 배지: ${earnedCount} / ${badges.length} 획득`}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 flex-1 min-h-0 overflow-y-auto"
            >
              {/* E2 (헌법 제24조의2 정합) — 미획득 명도 차 강화: opacity-60 + grayscale */}
              {badges.map((b) => (
                <li
                  key={b.id}
                  className={`rounded-[10px] border px-2 pt-2.5 pb-2 text-center transition-all ${
                    b.earned
                      ? "border-gold bg-cream-soft hover:-translate-y-0.5"
                      : "border-rule bg-cream opacity-60 grayscale"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`mx-auto grid h-7 w-7 place-items-center rounded-full mb-1.5 ${
                      b.earned
                        ? "bg-gold-soft text-gold"
                        : "bg-cream-deep text-muted-foreground"
                    }`}
                  >
                    <b.Icon className="h-[14px] w-[14px]" />
                  </span>
                  <p
                    className={`text-[11.5px] font-bold tracking-[-0.02em] truncate ${b.earned ? "text-foreground" : "text-muted2-deep"}`}
                  >
                    {b.title}
                  </p>
                  <p className="text-[9.5px] text-muted-foreground mt-0.5 leading-[1.3] tracking-[-0.005em] truncate">
                    {b.description}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        </section>

        {/* K1 (헌법 제4조의3·제3조의2 정합) — 정직성 안내, 한 줄로 컴팩트 */}
        <p className="text-[10.5px] text-muted-foreground leading-[1.4] break-keep shrink-0 xl:pt-0">
          본 마이 페이지의 통계·배지·활동 기록은{" "}
          <strong className="font-semibold text-muted2-deep">
            본인 계정의 실제 학습 데이터
          </strong>
          만으로 산출됩니다.
          외부 비교 지표는 사용하지 않습니다.
        </p>
      </div>
    </div>
  );
}
