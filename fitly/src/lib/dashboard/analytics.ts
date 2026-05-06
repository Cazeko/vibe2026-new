// 헌법 v3.0 / v3.0.1 — /study-analysis · /me 전용 보조 집계.
// D-S1.5 stub 해제 (2026-05-06) — cards 다형 테이블 + user_card_state 통합 query 활용.

import { and, desc, eq, gt, gte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { studySessions } from "@/lib/db/schema";
import type { HeatmapCell } from "@/components/feature/analysis/activity-heatmap";
import { getCardCounts, getDueCardCounts, safeRun } from "@/lib/db/queries";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getActivityHeatmap(userId: string): Promise<HeatmapCell[]> {
  return safeRun(
    "getActivityHeatmap",
    async () => {
      const db = getDb();
      const since = new Date(Date.now() - 84 * DAY_MS); // 12주

      const rows = await db
        .select({
          day: sql<string>`to_char(${studySessions.startedAt}, 'YYYY-MM-DD')`,
          sec: sql<number>`coalesce(sum(${studySessions.durationSeconds}), 0)::int`,
        })
        .from(studySessions)
        .where(
          and(
            eq(studySessions.userId, userId),
            gte(studySessions.startedAt, since),
          ),
        )
        .groupBy(sql`to_char(${studySessions.startedAt}, 'YYYY-MM-DD')`);

      const byDay = new Map<string, number>();
      for (const r of rows) byDay.set(r.day, Math.round(Number(r.sec) / 60));

      const cells: HeatmapCell[] = [];
      for (let i = 83; i >= 0; i -= 1) {
        const d = new Date(Date.now() - i * DAY_MS);
        const key = d.toISOString().slice(0, 10);
        cells.push({ date: key, minutes: byDay.get(key) ?? 0 });
      }
      return cells;
    },
    [],
  );
}

export type SessionStat = {
  sessions: number;
  totalMinutes: number;
  totalCards: number;
  avgAccuracy: number;       // 0~100
  bestDayMinutes: number;
};

const EMPTY_SESSION_STAT: SessionStat = {
  sessions: 0,
  totalMinutes: 0,
  totalCards: 0,
  avgAccuracy: 0,
  bestDayMinutes: 0,
};

export async function getSessionStats(userId: string): Promise<SessionStat> {
  return safeRun(
    "getSessionStats",
    async () => {
      const db = getDb();

      // cards_reviewed=0 row는 통계 노이즈로 제외 (5초 이상 머물기만 한 빈 세션).
      // 평균 정답률 산출에서 빈 세션이 분모를 흐리지 않도록 가드.
      const [agg] = await db
        .select({
          sessions: sql<number>`count(*)::int`,
          sec: sql<number>`coalesce(sum(${studySessions.durationSeconds}), 0)::int`,
          cards: sql<number>`coalesce(sum(${studySessions.cardsReviewed}), 0)::int`,
          total: sql<number>`coalesce(sum(${studySessions.totalCount}), 0)::int`,
          correct: sql<number>`coalesce(sum(${studySessions.correctCount}), 0)::int`,
        })
        .from(studySessions)
        .where(
          and(
            eq(studySessions.userId, userId),
            gt(studySessions.cardsReviewed, 0),
          ),
        );

      const [bestDay] = await db
        .select({
          sec: sql<number>`coalesce(sum(${studySessions.durationSeconds}), 0)::int`,
        })
        .from(studySessions)
        .where(eq(studySessions.userId, userId))
        .groupBy(sql`to_char(${studySessions.startedAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`coalesce(sum(${studySessions.durationSeconds}), 0) desc`)
        .limit(1);

      return {
        sessions: agg?.sessions ?? 0,
        totalMinutes: Math.round((agg?.sec ?? 0) / 60),
        totalCards: agg?.cards ?? 0,
        avgAccuracy:
          agg && agg.total > 0
            ? Math.round((Number(agg.correct) / Number(agg.total)) * 100)
            : 0,
        bestDayMinutes: bestDay ? Math.round(bestDay.sec / 60) : 0,
      };
    },
    EMPTY_SESSION_STAT,
  );
}

// 헌법 v3.0 제13조의2 — 카드 라이브러리 카운트 (풀이/키워드/오답).
// D-S1.5 stub 해제: getCardCounts + getDueCardCounts 통합 query.
export type LibraryCounts = {
  quiz: number;
  keyword: number;
  mistake: number;
  quizDue: number;
  keywordDue: number;
  mistakeDue: number;
};

export async function getLibraryCounts(userId: string): Promise<LibraryCounts> {
  const [counts, due] = await Promise.all([
    getCardCounts(userId),
    getDueCardCounts(userId),
  ]);
  return {
    quiz: counts.quizTotal,
    keyword: counts.keywordTotal,
    mistake: counts.mistakeTotal,
    quizDue: due.quiz,
    keywordDue: due.keyword,
    mistakeDue: due.mistake,
  };
}

export type RecentActivity = {
  id: string;
  mode: string;
  startedAt: string;
  durationMinutes: number;
  cards: number;
  accuracy: number | null;
};

export async function getRecentActivity(
  userId: string,
  limit = 8,
): Promise<RecentActivity[]> {
  return safeRun(
    "getRecentActivity",
    async () => {
      const db = getDb();
      const rows = await db
        .select()
        .from(studySessions)
        .where(eq(studySessions.userId, userId))
        .orderBy(desc(studySessions.startedAt))
        .limit(limit);

      return rows.map((r) => ({
        id: r.id,
        mode: r.mode,
        startedAt: r.startedAt.toISOString(),
        durationMinutes: Math.round(r.durationSeconds / 60),
        cards: r.cardsReviewed,
        accuracy:
          r.totalCount > 0
            ? Math.round((r.correctCount / r.totalCount) * 100)
            : null,
      }));
    },
    [],
  );
}
