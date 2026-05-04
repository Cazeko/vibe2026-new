// 헌법 v2.0 — 대시보드 실데이터 집계 라이브러리.
// 입력은 user_id(auth.uid)뿐이며, 모든 쿼리에 user_id 일치를 강제한다(제28조 1항 단서).
// 외부 합격 컷·평균 의존 0. 본인 데이터로만 Progress 산출 (제3조의2, 제9조).

import { and, count, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  mistakes,
  vocabCards,
  studyCards,
  studySessions,
  learningLogs,
  materials,
  userProfiles,
} from "@/lib/db/schema";
import { computeProgress } from "@/lib/progress/score";
import type {
  DashboardKpi,
  DashboardSummary,
  PlanItem,
  RecentMaterial,
  TrendPoint,
  WeakType,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
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

const QUESTION_TYPE_LABEL: Record<string, string> = {
  vocab: "어휘 추론",
  grammar: "문법 일반",
  verb_form: "비동사/준동사",
  relative: "관계사",
  blank: "빈칸 추론",
  insert: "문장 삽입",
  reading: "독해 일반",
  unknown: "분류 미지정",
};

function formatMonthDay(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}`;
}

function shortName(name: string | null): string | null {
  if (!name) return null;
  return SHORT_NAME[name] ?? `${name}대`;
}

async function computeKpi(userId: string): Promise<DashboardKpi> {
  const db = getDb();

  const [profileRow] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

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
  // 최장 스트릭 (날짜 정렬 후 연속 묶음)
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

  // 학습 진척도(Progress) — v2.0 제9조
  // 1) 어휘 마스터율
  const [vocabTotalRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(vocabCards)
    .where(eq(vocabCards.userId, userId));
  const [vocabMasteredRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(vocabCards)
    .where(
      and(
        eq(vocabCards.userId, userId),
        sql`(${vocabCards.srsState}->>'state')::int >= 2`,
      ),
    );
  const vocabTotal = vocabTotalRow?.n ?? 0;
  const vocabMastered = vocabMasteredRow?.n ?? 0;

  // 2) 오답 정복률 — 최근 14일 mistakes 리뷰 (good/easy / 전체)
  const [mistakeReviewAgg] = await db
    .select({
      reviews: sql<number>`coalesce(sum(${studySessions.totalCount}), 0)::int`,
      correct: sql<number>`coalesce(sum(${studySessions.correctCount}), 0)::int`,
    })
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        eq(studySessions.mode, "review"),
        gte(studySessions.startedAt, since14),
      ),
    );
  const recentMistakeReviews = Number(mistakeReviewAgg?.reviews ?? 0);
  const recentMistakeCorrect = Number(mistakeReviewAgg?.correct ?? 0);

  // 3) 학습 일관성 — 최근 14일 학습일수
  const since14Iso = since14.toISOString();
  const recentDays = await db
    .select({ day: sql<string>`to_char(${studySessions.startedAt}, 'YYYY-MM-DD')` })
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        gte(studySessions.startedAt, since14),
      ),
    )
    .groupBy(sql`to_char(${studySessions.startedAt}, 'YYYY-MM-DD')`);
  const recentStudyDaysOf14 = Math.min(14, recentDays.length);
  void since14Iso;

  const breakdown = computeProgress({
    vocabTotal,
    vocabMastered,
    recentMistakeReviews,
    recentMistakeCorrect,
    recentStudyDaysOf14,
  });

  // D-day
  const examDate = profileRow?.examDate ? new Date(profileRow.examDate) : null;
  const daysToExam = examDate
    ? Math.max(0, Math.ceil((examDate.getTime() - now) / DAY_MS))
    : null;

  return {
    targetUniversity: targetName ? `${targetName}대학교` : null,
    targetUniversityShort: shortName(targetName),
    progressScore: breakdown.total,
    progressBreakdown: {
      vocabMasteryRate: breakdown.vocabMasteryRate,
      mistakeConquerRate: breakdown.mistakeConquerRate,
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

  // v2.0 — learning_logs.fitScore 컬럼은 v1 시절 학교 적합도용. 같은 컬럼을
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

async function computePlan(userId: string): Promise<PlanItem[]> {
  const db = getDb();
  const now = new Date();

  // 어휘 듀카드
  const [vocabDue] = await db
    .select({
      n: count(),
    })
    .from(vocabCards)
    .where(and(eq(vocabCards.userId, userId), lte(vocabCards.dueAt, now)));

  const [vocabTotal] = await db
    .select({ n: count() })
    .from(vocabCards)
    .where(eq(vocabCards.userId, userId));

  // 학습 카드 듀(자료에서 추출된 StudyCard)
  const [studyDue] = await db
    .select({ n: count() })
    .from(studyCards)
    .where(and(eq(studyCards.userId, userId), lte(studyCards.dueAt, now)));

  const [studyTotal] = await db
    .select({ n: count() })
    .from(studyCards)
    .where(eq(studyCards.userId, userId));

  // 오답 듀카드
  const [mistakeDue] = await db
    .select({ n: count() })
    .from(mistakes)
    .where(and(eq(mistakes.userId, userId), lte(mistakes.dueAt, now)));

  const [mistakeTotal] = await db
    .select({ n: count() })
    .from(mistakes)
    .where(eq(mistakes.userId, userId));

  // 오늘 푼 문제 수 (today exam_generate sessions)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [todayExam] = await db
    .select({
      total: sql<number>`coalesce(sum(${studySessions.totalCount}), 0)::int`,
    })
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        eq(studySessions.mode, "exam"),
        gte(studySessions.startedAt, todayStart),
      ),
    );

  const vocabProgress =
    vocabTotal && vocabTotal.n > 0
      ? Math.round(((vocabTotal.n - (vocabDue?.n ?? 0)) / vocabTotal.n) * 100)
      : 0;

  const mistakeProgress =
    mistakeTotal && mistakeTotal.n > 0
      ? Math.round(((mistakeTotal.n - (mistakeDue?.n ?? 0)) / mistakeTotal.n) * 100)
      : 0;

  const examCount = todayExam?.total ?? 0;
  const examProgress = Math.min(100, Math.round((examCount / 20) * 100));

  // 학습 카드 진행도(StudyCard)
  const studyProgress =
    studyTotal && studyTotal.n > 0
      ? Math.round(((studyTotal.n - (studyDue?.n ?? 0)) / studyTotal.n) * 100)
      : 0;

  return [
    {
      id: "plan-vocab",
      title: "어휘 — 학습 어휘",
      subtitle:
        (vocabTotal?.n ?? 0) === 0
          ? "어휘 시드 자동 적재됩니다"
          : `복습 대기 ${vocabDue?.n ?? 0} / 총 ${vocabTotal?.n ?? 0}`,
      progress: vocabProgress,
      state: vocabProgress >= 100 ? "completed" : "in_progress",
      href: "/study/vocab",
    },
    {
      id: "plan-study",
      title: "기출 풀이 — 내 자료",
      subtitle:
        (studyTotal?.n ?? 0) === 0
          ? "자료를 업로드하면 학습 카드가 자동 생성됩니다"
          : `복습 대기 ${studyDue?.n ?? 0} / 총 ${studyTotal?.n ?? 0}`,
      progress: studyProgress,
      state:
        (studyTotal?.n ?? 0) === 0
          ? "locked"
          : studyProgress >= 100
            ? "completed"
            : "in_progress",
      href: "/study/exam",
    },
    {
      id: "plan-exam",
      title: "기출 풀이 — 오늘",
      subtitle: `오늘 푼 문제 ${examCount}/20`,
      progress: examProgress,
      state: examProgress >= 100 ? "completed" : "in_progress",
      href: "/study/exam",
    },
    {
      id: "plan-mistake",
      title: "리뷰 & 오답 노트",
      subtitle:
        (mistakeTotal?.n ?? 0) === 0
          ? "내 자료를 풀다가 틀리면 합류됩니다"
          : `복습 대기 ${mistakeDue?.n ?? 0} / 총 ${mistakeTotal?.n ?? 0}`,
      progress: mistakeProgress,
      state:
        (mistakeTotal?.n ?? 0) === 0
          ? "locked"
          : mistakeProgress >= 100
            ? "completed"
            : "in_progress",
      href: "/study/review",
    },
  ];
}

async function computeWeakTypes(userId: string): Promise<WeakType[]> {
  const db = getDb();

  const rows = await db
    .select({
      type: mistakes.questionType,
      total: sql<number>`count(*)::int`,
      lapses: sql<number>`coalesce(sum(${mistakes.lapseCount}), 0)::int`,
      reviews: sql<number>`coalesce(sum(${mistakes.reviewCount}), 0)::int`,
    })
    .from(mistakes)
    .where(and(eq(mistakes.userId, userId), isNotNull(mistakes.questionType)))
    .groupBy(mistakes.questionType);

  const items: WeakType[] = rows.map((r) => {
    const total = Number(r.total ?? 0);
    const reviews = Number(r.reviews ?? 0);
    const lapses = Number(r.lapses ?? 0);
    // 정답률 ≈ (전체 리뷰 - lapse) / 전체 리뷰
    const accuracy =
      reviews > 0
        ? Math.max(0, Math.round(((reviews - lapses) / reviews) * 100))
        : 50; // 신규 카드 기본
    const key = r.type ?? "unknown";
    return {
      id: `wt-${key}`,
      label: QUESTION_TYPE_LABEL[key] ?? key,
      accuracy,
      total,
    };
  });

  return items.sort((a, b) => a.accuracy - b.accuracy).slice(0, 6);
}

async function computeRecentMaterials(userId: string): Promise<RecentMaterial[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(materials)
    .where(eq(materials.userId, userId))
    .orderBy(desc(materials.createdAt))
    .limit(5);

  return rows.map((r) => {
    const sizeMb = r.sizeBytes ? (r.sizeBytes / 1024 / 1024).toFixed(1) : "—";
    const date = new Date(r.createdAt);
    const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
    const mime = r.mimeType?.includes("pdf") ? "PDF" : (r.mimeType ?? "FILE");
    return {
      id: r.id,
      name: r.name,
      meta: `${mime} · ${sizeMb}MB · ${dateStr}`,
    };
  });
}

export async function getDashboardSummary(
  userId: string,
): Promise<DashboardSummary> {
  const [kpi, trend, plan, weakTypes, recent] = await Promise.all([
    computeKpi(userId),
    computeTrend(userId),
    computePlan(userId),
    computeWeakTypes(userId),
    computeRecentMaterials(userId),
  ]);

  const isEmpty =
    kpi.studyMinutes === 0 &&
    kpi.streakDays === 0 &&
    trend.every((t) => t.progress == null) &&
    weakTypes.length === 0 &&
    recent.length === 0;

  return { kpi, trend, plan, weakTypes, recent, isEmpty };
}
