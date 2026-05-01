-- Fitly · 0005_user_profiles
-- 헌법 제5조 (3액션 진입장벽 0) + 제28조 (RLS 의무)

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id            uuid PRIMARY KEY,
  target_university  varchar(16),
  exam_date          date,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_owner_select" ON public.user_profiles;
CREATE POLICY "user_profiles_owner_select"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_profiles_owner_insert" ON public.user_profiles;
CREATE POLICY "user_profiles_owner_insert"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_profiles_owner_update" ON public.user_profiles;
CREATE POLICY "user_profiles_owner_update"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_profiles_owner_delete" ON public.user_profiles;
CREATE POLICY "user_profiles_owner_delete"
  ON public.user_profiles FOR DELETE
  USING (auth.uid() = user_id);
