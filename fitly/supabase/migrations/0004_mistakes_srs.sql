-- Fitly · 0004_mistakes_srs
-- 헌법 제13조의2 (통합 SRS 큐) + 제18조 3항 (ts-fsrs)

ALTER TABLE public.mistakes
  ADD COLUMN IF NOT EXISTS srs_state    jsonb,
  ADD COLUMN IF NOT EXISTS due_at       timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lapse_count  integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_mistakes_user_due
  ON public.mistakes (user_id, due_at);

COMMENT ON COLUMN public.mistakes.srs_state IS
  'ts-fsrs Card 직렬화 상태 — 헌법 제13조의2 통합 SRS';
