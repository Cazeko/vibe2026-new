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
--   CREATE INDEX CONCURRENTLY 는 트랜잭션 안에서 실행 불가. drizzle-kit migrate
--   는 트랜잭션 wrap 하므로 본 마이그레이션은 **supabase SQL editor 또는 psql 에서
--   수동 실행** 필요. concurrently 옵션으로 production 테이블 lock 없이 적용.
--   적용 후 drizzle journal 에 0002 entry 추가 (meta/0002_snapshot.json + journal).
--
-- ANALYZE 는 인덱스 생성 직후 자동 실행되지만 통계 갱신을 명시적으로 보장.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "study_sessions_user_started_idx"
  ON "study_sessions" USING btree ("user_id", "started_at" DESC);
--> statement-breakpoint

CREATE INDEX CONCURRENTLY IF NOT EXISTS "user_card_log_user_time_idx"
  ON "user_card_log" USING btree ("user_id", "reviewed_at" DESC);
--> statement-breakpoint

ANALYZE "study_sessions";
--> statement-breakpoint

ANALYZE "user_card_log";
