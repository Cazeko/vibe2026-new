-- 헌법 제28조 (개인정보 — RLS 의무) 이행 정책
-- 적용: Supabase 프로젝트의 SQL 에디터에서 1회 실행

ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mistakes_owner_select"
  ON mistakes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "mistakes_owner_insert"
  ON mistakes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mistakes_owner_update"
  ON mistakes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mistakes_owner_delete"
  ON mistakes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mistakes_user_created
  ON mistakes (user_id, created_at DESC);
