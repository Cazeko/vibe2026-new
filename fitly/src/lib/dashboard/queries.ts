// 헌법 v3.0 / v3.0.1 — 대시보드 실데이터 집계.
// D-S1.5 stub 해제 (2026-05-06) — cards 다형 테이블 + user_card_state 통합 query를
// `lib/db/queries.ts`에 도입, 풀이/키워드 마스터율 실측 + plan due 카운트 활성화.

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  studySessions,
  learningLogs,
  userProfiles,
} from "@/lib/db/schema";
import { computeProgress } from "@/lib/progress/score";
import { getCardCounts, getDueCardCounts } from "@/lib/db/queries";
import type {
  DashboardKpi,
  DashboardSummary,
  PlanItem,
  TrendPoint,
  WeakType,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

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

  const dateSet = new Set(
    recentSessions.map((r) => new Date(r.startedAt).toISOString().slice(0, 10)),
  );
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
  const due = await getDueCardCounts(userId);

  const planRow = (
    id: string,
    title: string,
    type: "quiz" | "keyword" | "mistake",
    href: string,
    fallbackSubtitle: string,
  ): PlanItem => {
    const dueCount = due[type];
    return {
      id,
      title,
      subtitle: dueCount > 0 ? `오늘 ${dueCount}장 due` : fallbackSubtitle,
      progress: 0,
      state: dueCount > 0 ? "in_progress" : "locked",
      href,
    };
  };

  return [
    planRow(
      "plan-quiz",
      "풀이 트랙 — 서술형 기출",
      "quiz",
      "/study/quiz",
      "오늘의 due 없음 — 새 카드 학습",
    ),
    planRow(
      "plan-keyword",
      "키워드 트랙 — 개념 정리 노트",
      "keyword",
      "/study?track=keyword",
      "오늘의 due 없음 — 새 카드 학습",
    ),
    planRow(
      "plan-mistake",
      "오답 트랙",
      "mistake",
      "/study?track=mistake",
      "풀이를 again/hard 로 평가하면 자동 합류",
    ),
  ];
}

// v3.0 / D-S1.5 — questionType 기반 약점 분석은 cards.type / exam_items.format 통합 후
// D-S2에서 reimplement. 현재는 빈 배열.
async function computeWeakTypes(_userId: string): Promise<WeakType[]> {
  return [];
}

export async function getDashboardSummary(
  userId: string,
): Promise<DashboardSummary> {
  const [kpi, trend, plan, weakTypes] = await Promise.all([
    computeKpi(userId),
    computeTrend(userId),
    computePlan(userId),
    computeWeakTypes(userId),
  ]);

  const isEmpty =
    kpi.studyMinutes === 0 &&
    kpi.streakDays === 0 &&
    trend.every((t) => t.progress == null) &&
    weakTypes.length === 0;

  return { kpi, trend, plan, weakTypes, isEmpty };
}
