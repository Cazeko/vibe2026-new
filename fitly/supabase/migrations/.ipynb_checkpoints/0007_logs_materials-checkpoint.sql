-- 헌법 v1.10 부칙 제3조 D19 — 실데이터 대시보드 + /materials 백엔드 와이어링.
-- 신규 3 테이블: study_sessions, learning_logs, materials.
-- 기존 mistakes 테이블에 question_type 컬럼 추가(취약 유형 집계용).
-- 모든 테이블에 RLS 정책 적용(제28조 1항). 코드 layer에서도 user_id 강제(제28조 단서).

------------------------------------------------------------
-- 1. study_sessions — 개별 학습 세션 기록 (시간/정답률 집계 원천)
------------------------------------------------------------
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  mode varchar(16) not null,                       -- vocab | exam | review
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  cards_reviewed integer not null default 0,
  correct_count integer not null default 0,
  total_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists study_sessions_user_started_idx
  on public.study_sessions (user_id, started_at desc);

alter table public.study_sessions enable row level security;

drop policy if exists "study_sessions_select_own" on public.study_sessions;
create policy "study_sessions_select_own"
  on public.study_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "study_sessions_insert_own" on public.study_sessions;
create policy "study_sessions_insert_own"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "study_sessions_update_own" on public.study_sessions;
create policy "study_sessions_update_own"
  on public.study_sessions for update
  using (auth.uid() = user_id);

drop policy if exists "study_sessions_delete_own" on public.study_sessions;
create policy "study_sessions_delete_own"
  on public.study_sessions for delete
  using (auth.uid() = user_id);

------------------------------------------------------------
-- 2. learning_logs — 일자별 누적 (Fit·정답률 추이용 30일 차트 원천)
------------------------------------------------------------
create table if not exists public.learning_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  log_date date not null,
  fit_score numeric(5,2),
  accuracy numeric(5,2),
  study_minutes integer not null default 0,
  cards_reviewed integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists learning_logs_user_date_idx
  on public.learning_logs (user_id, log_date desc);

alter table public.learning_logs enable row level security;

drop policy if exists "learning_logs_select_own" on public.learning_logs;
create policy "learning_logs_select_own"
  on public.learning_logs for select
  using (auth.uid() = user_id);

drop policy if exists "learning_logs_insert_own" on public.learning_logs;
create policy "learning_logs_insert_own"
  on public.learning_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "learning_logs_update_own" on public.learning_logs;
create policy "learning_logs_update_own"
  on public.learning_logs for update
  using (auth.uid() = user_id);

drop policy if exists "learning_logs_delete_own" on public.learning_logs;
create policy "learning_logs_delete_own"
  on public.learning_logs for delete
  using (auth.uid() = user_id);

------------------------------------------------------------
-- 3. materials — 업로드된 자료 메타데이터
-- (실제 파일 본체는 Supabase Storage `materials` 버킷에 저장; 본 테이블은 메타만 보관)
------------------------------------------------------------
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  storage_path text,
  mime_type varchar(64),
  size_bytes integer,
  pages integer,
  status varchar(16) not null default 'uploaded',  -- uploaded | parsed | failed
  source varchar(16) not null default 'upload',    -- upload | seed
  created_at timestamptz not null default now()
);

create index if not exists materials_user_created_idx
  on public.materials (user_id, created_at desc);

alter table public.materials enable row level security;

drop policy if exists "materials_select_own" on public.materials;
create policy "materials_select_own"
  on public.materials for select
  using (auth.uid() = user_id);

drop policy if exists "materials_insert_own" on public.materials;
create policy "materials_insert_own"
  on public.materials for insert
  with check (auth.uid() = user_id);

drop policy if exists "materials_update_own" on public.materials;
create policy "materials_update_own"
  on public.materials for update
  using (auth.uid() = user_id);

drop policy if exists "materials_delete_own" on public.materials;
create policy "materials_delete_own"
  on public.materials for delete
  using (auth.uid() = user_id);

------------------------------------------------------------
-- 4. mistakes 테이블 — 유형 분류 컬럼 추가(취약 유형 집계용)
------------------------------------------------------------
alter table public.mistakes
  add column if not exists question_type varchar(24);

create index if not exists mistakes_user_question_type_idx
  on public.mistakes (user_id, question_type);

------------------------------------------------------------
-- 5. Storage 버킷 안내(수동 적용 필요)
-- Supabase 콘솔 → Storage → New bucket → name="materials" private
-- RLS:
--   create policy "Users can upload to own folder" on storage.objects
--     for insert with check (
--       bucket_id = 'materials'
--       and auth.uid()::text = (storage.foldername(name))[1]
--     );
--   동일 패턴으로 select/update/delete 4종 정책 추가.
------------------------------------------------------------
