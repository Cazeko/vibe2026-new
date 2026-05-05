-- Fitly · 0006_user_self_corrected
-- 헌법 v1.8 제30조의2 — 정답·해설 4계층 출처 모델.
-- 'crowd_verified'는 "2명 이상 서로 다른 사용자가 동일 답을 제출"한 경우로 한정.
-- 단일 사용자의 자가 정정은 'user_self_corrected'로 라벨한다.

ALTER TABLE public.mistakes
  DROP CONSTRAINT IF EXISTS mistakes_answer_source_check;

ALTER TABLE public.mistakes
  ADD CONSTRAINT mistakes_answer_source_check
  CHECK (
    answer_source IN (
      'official',
      'ai_estimate',
      'user_self_corrected',
      'crowd_verified'
    )
  );

COMMENT ON COLUMN public.mistakes.answer_source IS
  'official | ai_estimate | user_self_corrected | crowd_verified — 헌법 v1.8 제30조의2';
