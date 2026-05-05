-- Fitly · 0002_vocab
-- 헌법 제13조의2 (VocabCard) + 제18조 3항 (ts-fsrs 통합 SRS)

CREATE TABLE IF NOT EXISTS public.vocab_cards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  term          text NOT NULL,
  definition    text NOT NULL,
  example       text,
  level         varchar(16),
  source        varchar(24) NOT NULL DEFAULT 'vocab_seed',
  srs_state     jsonb,
  due_at        timestamptz NOT NULL DEFAULT now(),
  review_count  integer NOT NULL DEFAULT 0,
  lapse_count   integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vocab_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vocab_owner_select" ON public.vocab_cards;
CREATE POLICY "vocab_owner_select"
  ON public.vocab_cards FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "vocab_owner_insert" ON public.vocab_cards;
CREATE POLICY "vocab_owner_insert"
  ON public.vocab_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "vocab_owner_update" ON public.vocab_cards;
CREATE POLICY "vocab_owner_update"
  ON public.vocab_cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "vocab_owner_delete" ON public.vocab_cards;
CREATE POLICY "vocab_owner_delete"
  ON public.vocab_cards FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vocab_user_due
  ON public.vocab_cards (user_id, due_at);

CREATE INDEX IF NOT EXISTS idx_vocab_user_term
  ON public.vocab_cards (user_id, term);
