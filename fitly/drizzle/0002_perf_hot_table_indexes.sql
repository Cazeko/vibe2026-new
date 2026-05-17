-- 2026-05-17 (팀원 보고) — 마이페이지·학습분석 1분+ 로딩 + Vercel 30s timeout
-- + supabase auth refresh 실패로 로그아웃 회귀. 원인 진단:
--   1. study_sessions (user_id, started_at) 인덱스 없음 → KPI/heatmap/sessionStats/
--      recentActivity/trend/weekly minutes 7개 쿼리가 풀스캔. 데모 시드 180일 누적
--      행 + Promise.all 동시 실행으로 cumulative time이 statement_timeout 초과.
--   2. user_card_log (user_id, card_id, reviewed_at) 인덱스는 weak types 60d
--      window 쿼리에서 card_id 가 prefix 중간이라 range scan 비효율. 새 인덱스로
--      reviewed_at 을 prefix 2번째로 배치.
--
-- 운영자 적용 노트:
--   Supabase SQL Editor 또는 psql 에서 그대로 실행하시면 됩니다.
--
--   ▼ CONCURRENTLY 미사용 사유 ▼
--   Supabase SQL Editor 는 statements 를 단일 트랜잭션으로 wrap 하는데,
--   CREATE INDEX CONCURRENTLY 는 트랜잭션 밖에서만 실행 가능 (PG 25001 에러).
--   현재 운영 데이터 규모(소수 사용자 + 데모 시드 수백~수천 행)에서는 일반
--   CREATE INDEX 의 lock 시간이 ms 단위라 무해. 운영 데이터가 10k+ 사용자로
--   확장된 후 본 인덱스를 재생성할 일이 생기면 psql 에서 CONCURRENTLY 변형을
--   별도로 실행하세요 (해당 SQL 은 본 파일 하단 주석 참고).
--
-- ANALYZE 로 통계 즉시 갱신해 옵티마이저가 새 인덱스 바로 활용.

CREATE INDEX IF NOT EXISTS "study_sessions_user_started_idx"
  ON "study_sessions" USING btree ("user_id", "started_at" DESC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "user_card_log_user_time_idx"
  ON "user_card_log" USING btree ("user_id", "reviewed_at" DESC);
--> statement-breakpoint

ANALYZE "study_sessions";
--> statement-breakpoint

ANALYZE "user_card_log";

-- ─────────────────────────────────────────────────────────────────────────
-- (참고) 운영 10k+ 사용자 확장 후 lock-free 재생성이 필요한 경우 — psql 직접 접속:
--
--   psql $DATABASE_URL <<SQL
--   DROP INDEX IF EXISTS study_sessions_user_started_idx;
--   CREATE INDEX CONCURRENTLY study_sessions_user_started_idx
--     ON study_sessions USING btree (user_id, started_at DESC);
--   DROP INDEX IF EXISTS user_card_log_user_time_idx;
--   CREATE INDEX CONCURRENTLY user_card_log_user_time_idx
--     ON user_card_log USING btree (user_id, reviewed_at DESC);
--   ANALYZE study_sessions;
--   ANALYZE user_card_log;
--   SQL
-- ─────────────────────────────────────────────────────────────────────────
