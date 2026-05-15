// 헌법 v3.0 / v3.0.1 — 대시보드 실데이터 집계.
// D-S1.5 stub 해제 (2026-05-06) — cards 다형 테이블 + user_card_state 통합 query를
// `lib/db/queries.ts`에 도입, 풀이/키워드 마스터율 실측 + plan due 카운트 활성화.

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  studySessions,
  learningLogs,
  userProfiles,
  userStreakFreezes,
} from "@/lib/db/schema";
import { computeProgress } from "@/lib/progress/score";
import {
  getCardCounts,
  getReviewDueCardCounts,
  getReviewedTodayCounts,
  safeRun,
} from "@/lib/db/queries";
import type {
  DashboardKpi,
  DashboardSummary,
  PlanItem,
  TrendPoint,
  WeakType,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

const EMPTY_KPI: DashboardKpi = {
  targetRegion: null,
  targetRegionShort: null,
  progressScore: 0,
  progressBreakdown: {
    quizMasteryRate: 0,
    keywordMasteryRate: 0,
    studyConsistency: 0,
  },
  studyMinutes: 0,
  studyDeltaMinutes: 0,
  streakDays: 0,
  streakBest: 0,
  daysToExam: null,
  streakFreezesAvailable: 2,
  canFreezeToday: true,
};

// 헌법 v3.5.1 제16조 — 잔디 얼리기 상한.
const STREAK_FREEZE_WINDOW_DAYS = 30;
const STREAK_FREEZE_MAX = 2;

// 헌법 v3.0 제15조 — 지역 교육청 17개 라벨 (선택 입력).
const REGION_SHORT: Record<string, string> = {
  서울: "서울",
  경기: "경기",
  인천: "인천",
  부산: "부산",
  대구: "대구",
  광주: "광주",
  대전: "대전",
  울산: "울산",
  세종: "세종",
  강원: "강원",
  충북: "충북",
  충남: "충남",
  전북: "전북",
  전남: "전남",
  경북: "경북",
  경남: "경남",
  제주: "제주",
};

function formatMonthDay(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}`;
}

function regionShort(name: string | null): string | null {
  if (!name) return null;
  return REGION_SHORT[name] ?? name;
}

async function computeKpi(userId: string): Promise<DashboardKpi> {
  const db = getDb();

  const [profileRow] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  // v3.0 — targetUniversity 컬럼은 v3.0 마이그레이션에서 targetRegion 으로 의미 전환되거나
  // 별도 컬럼이 추가될 예정. 현 시점은 기존 컬럼을 region 라벨로 임시 재해석.
  const targetName = profileRow?.targetUniversity ?? null;

  const now = Date.now();
  const since7 = new Date(now - 7 * DAY_MS);
  const since14 = new Date(now - 14 * DAY_MS);

  // 학습 시간 — 최근 7일/14일
  const [recentMins] = await db
    .select({
      sec: sql<number>`coalesce(sum(${studySessions.durationSeconds}), 0)::int`,
    })
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        gte(studySessions.startedAt, since7),
      ),
    );

  const [prevWeekMins] = await db
    .select({
      sec: sql<number>`coalesce(sum(${studySessions.durationSeconds}), 0)::int`,
    })
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        gte(studySessions.startedAt, since14),
      ),
    );

  const studyMinutes = Math.round((recentMins?.sec ?? 0) / 60);
  const prev14Minutes = Math.round((prevWeekMins?.sec ?? 0) / 60);
  const studyDeltaMinutes = Math.max(0, studyMinutes - (prev14Minutes - studyMinutes));

  // 연속 학습일 (스트릭)
  const recentSessions = await db
    .select({ startedAt: studySessions.startedAt })
    .from(studySessions)
    .where(eq(studySessions.userId, userId))
    .orderBy(desc(studySessions.startedAt))
    .limit(120);

  // 헌법 v3.5.1 제16조 — 잔디 얼리기 dateSet union. 학습 못한 날에 freeze 적용
  // 시 streak 끊김 방지. 30일 윈도우 데이터까지 페치 (상한 검증 + dateSet 양쪽).
  const since30Date = new Date(
    Date.now() - STREAK_FREEZE_WINDOW_DAYS * DAY_MS,
  );
  const since30Str = since30Date.toISOString().slice(0, 10);
  const freezeRows = await db
    .select({ frozenDate: userStreakFreezes.frozenDate })
    .from(userStreakFreezes)
    .where(
      and(
        eq(userStreakFreezes.userId, userId),
        gte(userStreakFreezes.frozenDate, since30Str),
      ),
    );
  const frozenDateStrs = freezeRows.map((r) =>
    typeof r.frozenDate === "string"
      ? r.frozenDate
      : new Date(r.frozenDate as unknown as Date).toISOString().slice(0, 10),
  );

  const dateSet = new Set([
    ...recentSessions.map((r) =>
      new Date(r.startedAt).toISOString().slice(0, 10),
    ),
    ...frozenDateStrs,
  ]);
  const todayStr = new Date().toISOString().slice(0, 10);
  const studiedToday = recentSessions.some(
    (r) => new Date(r.startedAt).toISOString().slice(0, 10) === todayStr,
  );
  const frozenToday = frozenDateStrs.includes(todayStr);
  const streakFreezesAvailable = Math.max(
    0,
    STREAK_FREEZE_MAX - frozenDateStrs.length,
  );
  const canFreezeToday =
    !studiedToday && !frozenToday && streakFreezesAvailable > 0;
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 120; i += 1) {
    const d = new Date(today.getTime() - i * DAY_MS).toISOString().slice(0, 10);
    if (dateSet.has(d)) streak += 1;
    else if (i === 0) continue;
    else break;
  }
  const sorted = [...dateSet].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev === null) {
      run = 1;
    } else {
      const gap = (Date.parse(d) - Date.parse(prev)) / DAY_MS;
      run = gap === 1 ? run + 1 : 1;
    }
    if (run > best) best = run;
    prev = d;
  }
  const streakBest = Math.max(streak, best);

  // 학습 진척도(Progress) — 헌법 v3.0 제9조
  //   풀이 마스터율 × 0.5 + 키워드 마스터율 × 0.2 + 학습 일관성 × 0.3
  const since14Days = await db
    .select({ day: sql<string>`to_char(${studySessions.startedAt}, 'YYYY-MM-DD')` })
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        gte(studySessions.startedAt, since14),
      ),
    )
    .groupBy(sql`to_char(${studySessions.startedAt}, 'YYYY-MM-DD')`);
  const recentStudyDaysOf14 = Math.min(14, since14Days.length);

  const counts = await getCardCounts(userId);
  const breakdown = computeProgress({
    quizTotal: counts.quizTotal,
    quizMastered: counts.quizMastered,
    keywordTotal: counts.keywordTotal,
    keywordMastered: counts.keywordMastered,
    recentStudyDaysOf14,
  });

  // D-day
  const examDate = profileRow?.examDate ? new Date(profileRow.examDate) : null;
  const daysToExam = examDate
    ? Math.max(0, Math.ceil((examDate.getTime() - now) / DAY_MS))
    : null;

  return {
    targetRegion: targetName,
    targetRegionShort: regionShort(targetName),
    progressScore: breakdown.total,
    progressBreakdown: {
      quizMasteryRate: breakdown.quizMasteryRate,
      keywordMasteryRate: breakdown.keywordMasteryRate,
      studyConsistency: breakdown.studyConsistency,
    },
    studyMinutes,
    studyDeltaMinutes,
    streakDays: streak,
    streakBest,
    daysToExam,
    streakFreezesAvailable,
    canFreezeToday,
  };
}

async function computeTrend(userId: string): Promise<TrendPoint[]> {
  const db = getDb();
  const now = Date.now();
  const since30 = new Date(now - 29 * DAY_MS);

  const logs = await db
    .select({
      logDate: learningLogs.logDate,
      fitScore: learningLogs.fitScore,
      accuracy: learningLogs.accuracy,
    })
    .from(learningLogs)
    .where(
      and(eq(learningLogs.userId, userId), gte(learningLogs.logDate, since30.toISOString().slice(0, 10))),
    )
    .orderBy(learningLogs.logDate);

  // v3.0 — learning_logs.fitScore 컬럼은 v1 시절 학교 적합도용. 같은 컬럼을
  // Progress 점수의 일자별 스냅샷으로 재해석하여 추이 그린다.
  const byDate = new Map<string, { progress: number | null; accuracy: number | null }>();
  for (const log of logs) {
    byDate.set(log.logDate, {
      progress: log.fitScore ? Number(log.fitScore) : null,
      accuracy: log.accuracy ? Number(log.accuracy) : null,
    });
  }

  const points: TrendPoint[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(now - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    const v = byDate.get(key);
    points.push({
      date: formatMonthDay(d),
      progress: v?.progress ?? null,
      accuracy: v?.accuracy ?? null,
    });
  }
  return points;
}

// 헌법 v3.0 제13조의2 — 3 트랙 SRS 큐 (풀이·키워드·오답).
// D-S1.5 stub 해제: getDueCardCounts로 오늘의 due 수를 실측.
async function computePlan(userId: string): Promise<PlanItem[]> {
  // 주인님 발화 (2026-05-15) — 회귀 3건 동시 수정.
  //  1. 종전 getDueCardCounts 는 NEW(미학습) 시드까지 포함해 "오늘 292장" 같은
  //     체감 어긋난 큰 수치 노출 → 학습 시작 카드 중 due 도래한 것만 카운트하는
  //     getReviewDueCardCounts 로 교체 (study-plan 의 "오늘의 복습 대기" 와 정합).
  //  2. progress 가 0% 고정 → 오늘 학습 카드 / (오늘 학습 + 남은 due) × 100 로
  //     실제 진행률 계산. KST 00:00 기준 user_card_log distinct cardId 카운트.
  //  3. subtitle 의 "due" 영문 → "복습" 한글 (어려운 용어 제거 발화 정합).
  const [reviewDue, reviewedToday] = await Promise.all([
    getReviewDueCardCounts(userId),
    getReviewedTodayCounts(userId),
  ]);

  const planRow = (
    id: string,
    title: string,
    type: "quiz" | "keyword" | "mistake",
    href: string,
    fallbackSubtitle: string,
  ): PlanItem => {
    const dueCount = reviewDue[type];
    const reviewedCount = reviewedToday[type];
    const total = dueCount + reviewedCount;
    const progress =
      total > 0 ? Math.round((reviewedCount / total) * 100) : 0;
    const state: PlanItem["state"] =
      total === 0 ? "locked" : dueCount === 0 ? "completed" : "in_progress";
    const subtitle =
      dueCount > 0
        ? `오늘 ${dueCount}장 복습`
        : reviewedCount > 0
          ? `오늘 ${reviewedCount}장 완료`
          : fallbackSubtitle;
    return { id, title, subtitle, progress, state, href };
  };

  return [
    planRow(
      "plan-quiz",
      "풀이 트랙 — 서술형 기출",
      "quiz",
      "/study/quiz",
      "오늘의 복습 없음 — 새 카드 학습",
    ),
    planRow(
      "plan-keyword",
      "키워드 트랙 — 개념 정리 노트",
      "keyword",
      "/study/keyword",
      "오늘의 복습 없음 — 새 카드 학습",
    ),
    planRow(
      "plan-mistake",
      "오답 트랙",
      "mistake",
      "/study/mistake",
      "풀이를 ‘다시·어려움’ 으로 평가하면 자동 합류",
    ),
  ];
}

// 2026-05-16 — 데모용 약점 영역 산출 (D-S2 정식 구현 전 임시안).
// user_card_log × cards × exam_items.domains LATERAL JOIN 으로 최근 60일 윈도우
// 의 영역별 정답률 집계. `good`/`easy` = 정답, `again`/`hard` = 오답.
// HAVING COUNT(*) >= 5 로 표본 너무 적은 도메인은 노이즈 회피.
// 표시 라벨은 DB domain 값을 그대로 사용 (한글). exam-analysis/queries.ts:251
// 의 LATERAL JOIN 패턴과 정합.
// D-S2 정식 구현 시 user_attempts.selfGrade 와 user_card_log 양쪽을 통합한
// 약점 산출로 교체 예정.
const WEAK_WINDOW_DAYS = 60;
const WEAK_MIN_SAMPLES = 5;
const WEAK_LIMIT = 5;

async function computeWeakTypes(userId: string): Promise<WeakType[]> {
  return safeRun(
    "dashboard computeWeakTypes",
    async () => {
      const db = getDb();
      const since = new Date(Date.now() - WEAK_WINDOW_DAYS * DAY_MS);
      const rows = await db.execute<{
        domain: string;
        total: number;
        correct: number;
      }>(sql`
        select
          d.value as domain,
          count(*)::int as total,
          sum(case when ucl.grade in ('good','easy') then 1 else 0 end)::int as correct
        from user_card_log ucl
        join cards c on c.id = ucl.card_id
        join exam_items ei on ei.id = c.source_item_id
        cross join lateral jsonb_array_elements_text(ei.domains) as d(value)
        where ucl.user_id = ${userId}
          and ucl.reviewed_at >= ${since}
        group by d.value
        having count(*) >= ${WEAK_MIN_SAMPLES}
        order by (
          sum(case when ucl.grade in ('good','easy') then 1 else 0 end)::float
          / nullif(count(*), 0)
        ) asc
        limit ${WEAK_LIMIT}
      `);

      return rows.map((r, i) => ({
        id: `weak-${i}-${encodeURIComponent(r.domain)}`,
        label: r.domain,
        accuracy: Math.round((Number(r.correct) / Number(r.total)) * 100),
        total: Number(r.total),
      }));
    },
    [] as WeakType[],
  );
}

// 헌법 제37조 정합 — Dashboard·me·study-plan·study-analysis는 모두 본 함수를
// 호출하므로, 안의 4 sub-query 중 하나라도 throw하면 SSR 전체가 hang 가능.
// 각 sub-query는 자체 safeRun 또는 본 wrap 안의 safeRun으로 보호된다.
export async function getDashboardSummary(
  userId: string,
): Promise<DashboardSummary> {
  const [kpi, trend, plan, weakTypes] = await Promise.all([
    safeRun("computeKpi", () => computeKpi(userId), EMPTY_KPI),
    safeRun("computeTrend", () => computeTrend(userId), [] as TrendPoint[]),
    safeRun("computePlan", () => computePlan(userId), [] as PlanItem[]),
    computeWeakTypes(userId),
  ]);

  const isEmpty =
    kpi.studyMinutes === 0 &&
    kpi.streakDays === 0 &&
    trend.every((t) => t.progress == null) &&
    weakTypes.length === 0;

  return { kpi, trend, plan, weakTypes, isEmpty };
}
