-- Fitly · 0003_answer_source
-- 헌법 제30조의2 (3계층 출처 모델) + 제18조의2 (AI "검증 필요" 배지)

ALTER TABLE public.mistakes
  ADD COLUMN IF NOT EXISTS answer_source varchar(24) NOT NULL DEFAULT 'ai_estimate';

CREATE INDEX IF NOT EXISTS idx_mistakes_user_answer_source
  ON public.mistakes (user_id, answer_source);

COMMENT ON COLUMN public.mistakes.answer_source IS
  'official | ai_estimate | crowd_verified — 헌법 제30조의2';
