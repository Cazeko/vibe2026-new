-- Fitly · 0001_mistakes
-- 헌법 제17조 (Supabase Postgres) + 제28조 (RLS 의무) 이행
-- 적용: Supabase SQL 에디터에서 한 번 실행 (db:push 미사용 시)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) 테이블 (Drizzle schema/mistakes.ts와 동기화)
CREATE TABLE IF NOT EXISTS public.mistakes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  question    text NOT NULL,
  choices     jsonb,
  answer      text,
  explanation text,
  keywords    jsonb NOT NULL DEFAULT '[]'::jsonb,
  source      varchar(24) NOT NULL DEFAULT 'upload',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2) Row-Level Security 활성화
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;

-- 3) 소유자 전용 정책 (idempotent)
DROP POLICY IF EXISTS "mistakes_owner_select" ON public.mistakes;
CREATE POLICY "mistakes_owner_select"
  ON public.mistakes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "mistakes_owner_insert" ON public.mistakes;
CREATE POLICY "mistakes_owner_insert"
  ON public.mistakes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mistakes_owner_update" ON public.mistakes;
CREATE POLICY "mistakes_owner_update"
  ON public.mistakes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mistakes_owner_delete" ON public.mistakes;
CREATE POLICY "mistakes_owner_delete"
  ON public.mistakes FOR DELETE
  USING (auth.uid() = user_id);

-- 4) 사용자별 최신순 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_mistakes_user_created
  ON public.mistakes (user_id, created_at DESC);
