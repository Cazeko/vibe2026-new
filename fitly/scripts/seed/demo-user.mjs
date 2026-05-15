// scripts/seed/demo-user.mjs — 데모 시연용 가상 사용자 "홍길동" 시드.
//
// 헌법 §16 v3.6.4 (주관자 명시 요청) 정합. 6개월(180일) 사용 이력의 자연
// 스러운 분포를 생성하여 대시보드 위젯 6종을 모두 채운다:
//   KPI · 진척도 차트 · 오늘의 학습 플랜 · 활동량 히트맵 · 취약유형분석 · AI 추천
//
// 멱등성: 동일 이메일로 재실행 시 기존 사용자 데이터를 purge 후 재삽입.
//        auth.users row 는 보존 (--reset-auth 옵션으로만 삭제).
//
// 실행: npm run seed:demo
// 로그인: test@test.com / testtest

import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
} from "ts-fsrs";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// 환경 변수 로드
// ─────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = join(__dirname, "..", "..", ".env.local");
  const text = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}
const ENV = loadEnv();
const DATABASE_URL = process.env.DATABASE_URL || ENV.DATABASE_URL;
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || ENV.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_SERVICE_ROLE_KEY;
if (!DATABASE_URL) throw new Error("DATABASE_URL 미설정");
if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL 미설정");
if (!SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY 미설정");

const RESET_AUTH = process.argv.includes("--reset-auth");

// ─────────────────────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────────────────────
const DEMO_EMAIL = "test@test.com";
const DEMO_PASSWORD = "testtest";
const DEMO_NAME = "홍길동";
const TARGET_REGION = "서울";
const EXAM_DATE = "2027-01-09"; // 2026-05-16 기준 D-238

// 약점 영역 — 시드 검증 결과(수학 63개, 영어 40개 카드) 기반. 다른 영역(70~85%)
// 과 차별화되어 취약유형분석 위젯에서 명확히 약점으로 표시된다.
const WEAK_DOMAINS = new Set(["수학", "영어"]);

const NOW = new Date("2026-05-16T09:00:00+09:00");
const TOTAL_DAYS = 180;
const DAY_MS = 24 * 60 * 60 * 1000;

const PRNG_SEED = 20260516;

// ─────────────────────────────────────────────────────────────
// 결정적 PRNG + 통계 헬퍼
// ─────────────────────────────────────────────────────────────
function mulberry32(seed) {
  let t = seed | 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(PRNG_SEED);

function gaussian() {
  // Box–Muller. 평균 0, 표준편차 1.
  let u1 = rng() || 1e-9;
  let u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
function gaussianClip(mean, sd, lo, hi) {
  const v = mean + sd * gaussian();
  return Math.min(hi, Math.max(lo, v));
}
function triangular(lo, mode, hi) {
  const u = rng();
  const c = (mode - lo) / (hi - lo);
  return u < c
    ? lo + Math.sqrt(u * (hi - lo) * (mode - lo))
    : hi - Math.sqrt((1 - u) * (hi - lo) * (hi - mode));
}
function pickWeighted(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function binomial(n, p) {
  let s = 0;
  for (let i = 0; i < n; i++) if (rng() < p) s++;
  return s;
}
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

// 일자 인덱스 t ∈ [0, 179] (0=오래된, 179=오늘)에 대한 baseline accuracy.
// 0.55 → 0.82 시그모이드 곡선 (중반에 도약).
function baselineAccuracy(t) {
  return 0.55 + 0.27 * sigmoid((t - 90) / 22);
}
// 영역별 accuracy 조정 — 약점 도메인은 평균 0.50, 비약점은 +0.10pp
function domainAccuracy(t, isWeak) {
  const base = baselineAccuracy(t);
  return isWeak
    ? Math.max(0.35, base - 0.18 + 0.05 * sigmoid((t - 120) / 20))
    : Math.min(0.92, base + 0.04);
}

// ─────────────────────────────────────────────────────────────
// FSRS 시뮬레이션
// ─────────────────────────────────────────────────────────────
const fsrsParams = generatorParameters({ enable_fuzz: false });
const scheduler = fsrs(fsrsParams);
const GRADE_TO_RATING = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};
function replayCard(grades) {
  // grades: [{ grade: 'good', at: Date }, ...] 시간 순.
  let card = createEmptyCard(grades[0].at);
  for (const g of grades) {
    const result = scheduler.next(card, g.at, GRADE_TO_RATING[g.grade]);
    card = result.card;
  }
  return card;
}
function fsrsCardToState(card) {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review?.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────
// DB · Supabase 클라이언트
// ─────────────────────────────────────────────────────────────
const sql = postgres(DATABASE_URL, { prepare: false, max: 1 });
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─────────────────────────────────────────────────────────────
// 1. Auth 사용자 보장
// ─────────────────────────────────────────────────────────────
async function ensureUser() {
  let cursor = 1;
  let existing = null;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page: cursor,
      perPage: 200,
    });
    if (error) throw error;
    existing = data.users.find((u) => u.email === DEMO_EMAIL);
    if (existing) break;
    if (data.users.length < 200) break;
    cursor++;
  }

  if (existing && RESET_AUTH) {
    console.log(`  [auth] --reset-auth 옵션: 기존 ${DEMO_EMAIL} 삭제`);
    await admin.auth.admin.deleteUser(existing.id);
    existing = null;
  }

  if (existing) {
    console.log(`  [auth] 기존 사용자 재사용 (id=${existing.id})`);
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata || {}), name: DEMO_NAME },
    });
    if (error) throw error;
    return existing.id;
  }

  console.log(`  [auth] 신규 사용자 생성: ${DEMO_EMAIL}`);
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: DEMO_NAME },
  });
  if (error) throw error;
  return data.user.id;
}

// ─────────────────────────────────────────────────────────────
// 2. 기존 데이터 purge (auth.users 는 보존)
// ─────────────────────────────────────────────────────────────
async function purge(userId) {
  const tables = [
    "user_card_log",
    "user_card_state",
    "user_streak_freezes",
    "learning_logs",
    "study_sessions",
    "user_attempts",
    "user_card_ai_analysis",
    "user_card_highlights",
    "user_card_tags",
    "card_reports",
    "podcast_progress",
    "user_profiles",
  ];
  await sql.begin(async (tx) => {
    for (const t of tables) {
      // 일부 테이블은 환경에 따라 미존재 가능 — 에러는 무시
      try {
        await tx.unsafe(`DELETE FROM ${t} WHERE user_id = $1`, [userId]);
      } catch (e) {
        // 컬럼/테이블 없음 — 데모 시드에선 silent skip
        if (!/relation .* does not exist|column .* does not exist/i.test(
          String(e?.message ?? ""),
        )) {
          throw e;
        }
      }
    }
    // 사용자 소유 카드 (mistake 트랙)
    await tx`DELETE FROM cards WHERE user_id = ${userId}`;
  });
}

// ─────────────────────────────────────────────────────────────
// 3. 프로필
// ─────────────────────────────────────────────────────────────
async function seedProfile(userId) {
  await sql`
    INSERT INTO user_profiles (user_id, target_university, exam_date)
    VALUES (${userId}, ${TARGET_REGION}, ${EXAM_DATE})
  `;
}

// ─────────────────────────────────────────────────────────────
// 4. 카드 풀 로드 + 약점/강점 분할
// ─────────────────────────────────────────────────────────────
async function loadCardPool() {
  const rows = await sql`
    SELECT c.id AS card_id, c.type, ei.domains
    FROM cards c
    JOIN exam_items ei ON ei.id = c.source_item_id
    WHERE c.user_id IS NULL
      AND c.type IN ('quiz', 'keyword')
  `;
  const weak = [];
  const strong = [];
  for (const r of rows) {
    const doms = Array.isArray(r.domains) ? r.domains : [];
    const isWeak = doms.some((d) => WEAK_DOMAINS.has(d));
    (isWeak ? weak : strong).push({
      cardId: r.card_id,
      type: r.type,
      domains: doms,
      isWeak,
    });
  }
  return { weak, strong };
}

// ─────────────────────────────────────────────────────────────
// 5. 메인 시뮬레이션 — sessions + logs + learning_logs
// ─────────────────────────────────────────────────────────────
function dateAtDayOffset(t /* 0..179, 0=오래된 */) {
  const offset = TOTAL_DAYS - 1 - t;
  return new Date(NOW.getTime() - offset * DAY_MS);
}

const MODE_WEIGHTS = [
  ["quiz", 50],
  ["keyword", 25],
  ["mistake", 15],
  ["review", 8],
  ["exam", 2],
];

function pickMode() {
  return pickWeighted(
    MODE_WEIGHTS.map(([m]) => m),
    MODE_WEIGHTS.map(([, w]) => w),
  );
}

function pickSessionsCountForDay(d /* Date */) {
  const dow = d.getDay(); // 0=일, 6=토
  const isWeekend = dow === 0 || dow === 6;
  if (isWeekend) {
    // 주말 — 25% skip, 50% 1세션, 25% 2세션
    const r = rng();
    if (r < 0.25) return 0;
    if (r < 0.75) return 1;
    return 2;
  }
  // 평일 — 5% skip, 75% 1세션, 20% 2세션
  const r = rng();
  if (r < 0.05) return 0;
  if (r < 0.8) return 1;
  return 2;
}

function pickGrade(isWeak, t) {
  // 시간 후반(>=150)이면 good/easy 비율 +10pp
  const lateBoost = t >= 150 ? 1 : 0;
  if (isWeak) {
    return pickWeighted(
      ["again", "hard", "good", "easy"],
      [25 - lateBoost * 5, 35 - lateBoost * 5, 30 + lateBoost * 7, 10 + lateBoost * 3],
    );
  }
  return pickWeighted(
    ["again", "hard", "good", "easy"],
    [5, 15 - lateBoost * 3, 60 + lateBoost * 5, 20 + lateBoost * 8],
  );
}

async function simulate(userId, pool) {
  const allWeak = shuffle(pool.weak);
  const allStrong = shuffle(pool.strong);

  // 학습할 카드 풀 — 강점 100장 / 약점 60장 정도 샘플
  const weakPick = allWeak.slice(0, Math.min(60, allWeak.length));
  const strongPick = allStrong.slice(0, Math.min(120, allStrong.length));
  console.log(
    `  [pool] 약점 카드 ${weakPick.length}장 / 강점 카드 ${strongPick.length}장 선택`,
  );

  // cardId → 누적 grade 이벤트 로그 (FSRS 재생용)
  const cardEvents = new Map();
  function recordEvent(cardId, grade, at) {
    if (!cardEvents.has(cardId)) cardEvents.set(cardId, []);
    cardEvents.get(cardId).push({ grade, at });
  }

  const sessions = [];
  const logs = [];
  const dailyMinutes = new Array(TOTAL_DAYS).fill(0);
  const dailyCards = new Array(TOTAL_DAYS).fill(0);
  const dailyCorrect = new Array(TOTAL_DAYS).fill(0);
  const dailyTotal = new Array(TOTAL_DAYS).fill(0);

  for (let t = 0; t < TOTAL_DAYS; t++) {
    const dayDate = dateAtDayOffset(t);
    const nSessions = pickSessionsCountForDay(dayDate);
    if (nSessions === 0) continue;

    for (let s = 0; s < nSessions; s++) {
      const mode = pickMode();
      const isShortMode = mode === "mistake" || mode === "review";
      const durMin = triangular(
        isShortMode ? 8 : 15,
        isShortMode ? 18 : 25,
        isShortMode ? 30 : 40,
      );
      const durationSeconds = Math.round(durMin * 60);

      // 세션 시작 시각 — 평일 09:00~22:00, 두 번째 세션은 19:00 이후
      const hour =
        s === 0
          ? 9 + Math.floor(rng() * 12)
          : 19 + Math.floor(rng() * 3);
      const minute = Math.floor(rng() * 60);
      const startedAt = new Date(dayDate);
      startedAt.setHours(hour, minute, Math.floor(rng() * 60), 0);
      const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000);

      const cardsReviewed = Math.max(
        3,
        Math.round(durMin / (1.5 + rng() * 1.5)),
      );

      // 카드 추첨 — 약점 30%, 강점 70%
      let correctCount = 0;
      for (let i = 0; i < cardsReviewed; i++) {
        const useWeak = rng() < 0.3 && weakPick.length > 0;
        const pool = useWeak ? weakPick : strongPick;
        const card = pool[Math.floor(rng() * pool.length)];
        const grade = pickGrade(card.isWeak, t);
        const offsetMs = rng() * durationSeconds * 1000;
        const reviewedAt = new Date(startedAt.getTime() + offsetMs);
        recordEvent(card.cardId, grade, reviewedAt);
        if (grade === "good" || grade === "easy") correctCount++;
      }

      sessions.push({
        user_id: userId,
        mode,
        started_at: startedAt,
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        cards_reviewed: cardsReviewed,
        correct_count: correctCount,
        total_count: cardsReviewed,
      });

      dailyMinutes[t] += Math.round(durationSeconds / 60);
      dailyCards[t] += cardsReviewed;
      dailyCorrect[t] += correctCount;
      dailyTotal[t] += cardsReviewed;
    }
  }

  // learning_logs — 학습한 날에 한해 row 생성 (1 row per day)
  for (let t = 0; t < TOTAL_DAYS; t++) {
    if (dailyMinutes[t] === 0) continue;
    const dayDate = dateAtDayOffset(t);
    const logDateStr = `${dayDate.getFullYear()}-${String(
      dayDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`;
    const fitScore = gaussianClip(
      60 + 22 * sigmoid((t - 90) / 22),
      1.5,
      58,
      84,
    );
    const dayAccuracy =
      dailyTotal[t] > 0 ? (dailyCorrect[t] / dailyTotal[t]) * 100 : null;
    const accuracy =
      dayAccuracy === null
        ? null
        : Math.min(95, Math.max(45, dayAccuracy + gaussian() * 2));
    logs.push({
      user_id: userId,
      log_date: logDateStr,
      fit_score: fitScore.toFixed(2),
      accuracy: accuracy === null ? null : accuracy.toFixed(2),
      study_minutes: dailyMinutes[t],
      cards_reviewed: dailyCards[t],
    });
  }

  return { sessions, logs, cardEvents };
}

// ─────────────────────────────────────────────────────────────
// 6. INSERT — sessions / logs (batched)
// ─────────────────────────────────────────────────────────────
async function insertSessions(rows) {
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await sql`
      INSERT INTO study_sessions ${sql(
        chunk,
        "user_id",
        "mode",
        "started_at",
        "ended_at",
        "duration_seconds",
        "cards_reviewed",
        "correct_count",
        "total_count",
      )}
    `;
  }
}
async function insertLearningLogs(rows) {
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await sql`
      INSERT INTO learning_logs ${sql(
        chunk,
        "user_id",
        "log_date",
        "fit_score",
        "accuracy",
        "study_minutes",
        "cards_reviewed",
      )}
    `;
  }
}

// ─────────────────────────────────────────────────────────────
// 7. user_card_log + user_card_state — FSRS 재생
// ─────────────────────────────────────────────────────────────
async function insertCardLogsAndStates(userId, cardEvents) {
  const logRows = [];
  const stateRows = [];

  for (const [cardId, events] of cardEvents.entries()) {
    const sorted = events.slice().sort((a, b) => a.at - b.at);
    for (const ev of sorted) {
      logRows.push({
        user_id: userId,
        card_id: cardId,
        grade: ev.grade,
        reviewed_at: ev.at,
      });
    }
    const finalCard = replayCard(sorted);
    const lastReviewedAt = sorted[sorted.length - 1].at;
    let dueAt = finalCard.due;

    // due_at 분포 nudge — 오늘의 학습 플랜이 채워지도록
    // 30% → 오늘 ±12h, 20% → 과거 1~7일, 50% → 자연값 유지
    const r = rng();
    if (r < 0.3) {
      dueAt = new Date(NOW.getTime() + (rng() - 0.5) * 24 * 60 * 60 * 1000);
    } else if (r < 0.5) {
      dueAt = new Date(NOW.getTime() - (1 + rng() * 6) * DAY_MS);
    }

    stateRows.push({
      user_id: userId,
      card_id: cardId,
      fsrs_state: { ...fsrsCardToState(finalCard), due: dueAt.toISOString() },
      due_at: dueAt,
      last_reviewed_at: lastReviewedAt,
      mark: null,
    });
  }

  // log insert
  const BATCH = 400;
  for (let i = 0; i < logRows.length; i += BATCH) {
    const chunk = logRows.slice(i, i + BATCH);
    await sql`
      INSERT INTO user_card_log ${sql(
        chunk,
        "user_id",
        "card_id",
        "grade",
        "reviewed_at",
      )}
    `;
  }

  // state insert — jsonb 컬럼은 sql.json() 으로 명시 직렬화 (postgres.js 가
  // 평범한 객체를 jsonb 로 자동 추론 못 함)
  const stateRowsForInsert = stateRows.map((r) => ({
    ...r,
    fsrs_state: sql.json(r.fsrs_state),
  }));
  for (let i = 0; i < stateRowsForInsert.length; i += BATCH) {
    const chunk = stateRowsForInsert.slice(i, i + BATCH);
    await sql`
      INSERT INTO user_card_state ${sql(
        chunk,
        "user_id",
        "card_id",
        "fsrs_state",
        "due_at",
        "last_reviewed_at",
        "mark",
      )}
    `;
  }

  return { logCount: logRows.length, stateCount: stateRows.length };
}

// ─────────────────────────────────────────────────────────────
// 8. 잔디 얼리기 1건 (최근 30일 윈도우 내)
// ─────────────────────────────────────────────────────────────
async function seedStreakFreeze(userId) {
  const frozenDate = new Date(NOW.getTime() - 5 * DAY_MS);
  const ds = `${frozenDate.getFullYear()}-${String(
    frozenDate.getMonth() + 1,
  ).padStart(2, "0")}-${String(frozenDate.getDate()).padStart(2, "0")}`;
  await sql`
    INSERT INTO user_streak_freezes (user_id, frozen_date)
    VALUES (${userId}, ${ds})
    ON CONFLICT DO NOTHING
  `;
}

// ─────────────────────────────────────────────────────────────
// 검증 리포트
// ─────────────────────────────────────────────────────────────
async function report(userId) {
  const counts = await sql`
    SELECT
      (SELECT count(*) FROM user_profiles WHERE user_id = ${userId})::int AS profile,
      (SELECT count(*) FROM study_sessions WHERE user_id = ${userId})::int AS sessions,
      (SELECT count(*) FROM learning_logs WHERE user_id = ${userId})::int AS logs,
      (SELECT count(*) FROM user_card_log WHERE user_id = ${userId})::int AS card_logs,
      (SELECT count(*) FROM user_card_state WHERE user_id = ${userId})::int AS card_states,
      (SELECT count(*) FROM user_streak_freezes WHERE user_id = ${userId})::int AS freezes
  `;
  const due = await sql`
    SELECT count(*)::int AS n
    FROM user_card_state
    WHERE user_id = ${userId}
      AND due_at <= ${NOW}
  `;
  const weak = await sql`
    SELECT d.value AS domain,
           count(*)::int AS total,
           sum(case when ucl.grade in ('good','easy') then 1 else 0 end)::int AS correct
    FROM user_card_log ucl
    JOIN cards c ON c.id = ucl.card_id
    JOIN exam_items ei ON ei.id = c.source_item_id
    CROSS JOIN LATERAL jsonb_array_elements_text(ei.domains) AS d(value)
    WHERE ucl.user_id = ${userId}
      AND ucl.reviewed_at >= ${new Date(NOW.getTime() - 60 * DAY_MS)}
    GROUP BY d.value
    HAVING count(*) >= 5
    ORDER BY (sum(case when ucl.grade in ('good','easy') then 1 else 0 end)::float
              / nullif(count(*), 0)) ASC
    LIMIT 5
  `;
  console.log("\n=== 검증 리포트 ===");
  console.log("테이블별 행 수:", counts[0]);
  console.log("오늘 due 카드:", due[0].n);
  console.log("영역별 정답률 (낮은 순 top5):");
  for (const w of weak) {
    const acc = Math.round((w.correct / w.total) * 100);
    console.log(`  ${w.domain.padEnd(8)} ${acc}%  (${w.correct}/${w.total})`);
  }
}

// ─────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Fitly 데모 사용자 시드 ===");
  console.log(`이메일: ${DEMO_EMAIL}`);
  console.log(`비밀번호: ${DEMO_PASSWORD}`);
  console.log(`이름: ${DEMO_NAME}`);
  console.log(`시뮬레이션 기준일: ${NOW.toISOString()}`);
  console.log(`기간: ${TOTAL_DAYS}일`);

  console.log("\n[1] Auth 사용자 보장");
  const userId = await ensureUser();

  console.log("\n[2] 기존 데이터 purge");
  await purge(userId);

  console.log("\n[3] 프로필");
  await seedProfile(userId);

  console.log("\n[4] 카드 풀 로드");
  const pool = await loadCardPool();
  console.log(
    `  shared cards — 약점 풀 ${pool.weak.length}장 / 강점 풀 ${pool.strong.length}장`,
  );

  console.log("\n[5] 180일 학습 시뮬레이션");
  const { sessions, logs, cardEvents } = await simulate(userId, pool);
  console.log(
    `  세션 ${sessions.length}건 / 학습 일자 ${logs.length}일 / 누적 카드 이벤트 ${[...cardEvents.values()].reduce((a, b) => a + b.length, 0)}건 / distinct 카드 ${cardEvents.size}장`,
  );

  console.log("\n[6] study_sessions INSERT");
  await insertSessions(sessions);

  console.log("\n[7] learning_logs INSERT");
  await insertLearningLogs(logs);

  console.log("\n[8] user_card_log + user_card_state INSERT (FSRS 재생)");
  const { logCount, stateCount } = await insertCardLogsAndStates(
    userId,
    cardEvents,
  );
  console.log(`  user_card_log ${logCount}건 / user_card_state ${stateCount}건`);

  console.log("\n[9] 잔디 얼리기 1건");
  await seedStreakFreeze(userId);

  await report(userId);

  console.log("\n=== 완료 ===");
  console.log(`로그인: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .then(async () => {
    await sql.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("시드 실패:", err);
    await sql.end();
    process.exit(1);
  });
