-- 0012_podcast.sql — 팟캐스트 인프라 (헌법 v3.0 제13조의3, 법률 12 제13조의3)
--
-- 1. podcast_episodes 테이블 — drizzle schema(podcast-episodes.ts)와 정합
-- 2. podcast_progress 테이블 — 청취 진척 (drizzle schema podcast-progress.ts 정합)
-- 3. Storage bucket 'podcast-audio' — public read (shared) / per-user path (user)
-- 4. RLS — shared = anyone authenticated, user scope = self
--
-- 헌법 §3.2 정직성 — 모든 episode는 default verified=false. 운영자 검수 후 true.
-- 헌법 §17 보안 — 본인 user-scope episode는 본인만 접근.

-- ============================================================
-- 1) podcast_episodes
-- ============================================================
create table if not exists public.podcast_episodes (
  id uuid primary key default gen_random_uuid(),
  scope varchar(8) not null check (scope in ('shared', 'user')),
  user_id uuid references auth.users(id) on delete cascade,  -- shared면 NULL
  theme text not null,
  script_json jsonb,
  audio_url text,
  duration_sec integer,
  verified boolean not null default false,
  generated_at timestamptz not null default now(),
  -- shared면 user_id NULL, user면 NOT NULL
  constraint podcast_episodes_scope_user check (
    (scope = 'shared' and user_id is null) or
    (scope = 'user' and user_id is not null)
  )
);

create index if not exists podcast_episodes_scope_user_idx
  on public.podcast_episodes (scope, user_id);

create index if not exists podcast_episodes_generated_at_idx
  on public.podcast_episodes (generated_at desc);

alter table public.podcast_episodes enable row level security;

drop policy if exists podcast_episodes_select on public.podcast_episodes;
create policy podcast_episodes_select on public.podcast_episodes
  for select to authenticated
  using (
    scope = 'shared'
    or (scope = 'user' and user_id = auth.uid())
  );

drop policy if exists podcast_episodes_insert_own on public.podcast_episodes;
create policy podcast_episodes_insert_own on public.podcast_episodes
  for insert to authenticated
  with check (scope = 'user' and user_id = auth.uid());

-- service_role만 shared 에피소드 INSERT (운영자/시드)
-- (service_role bypasses RLS by default; no policy needed)

-- ============================================================
-- 2) podcast_progress
-- ============================================================
create table if not exists public.podcast_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references public.podcast_episodes(id) on delete cascade,
  current_sec integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, episode_id)
);

create index if not exists podcast_progress_user_idx
  on public.podcast_progress (user_id);

alter table public.podcast_progress enable row level security;

drop policy if exists podcast_progress_select_own on public.podcast_progress;
create policy podcast_progress_select_own on public.podcast_progress
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists podcast_progress_upsert_own on public.podcast_progress;
create policy podcast_progress_upsert_own on public.podcast_progress
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists podcast_progress_update_own on public.podcast_progress;
create policy podcast_progress_update_own on public.podcast_progress
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 3) Storage bucket — podcast-audio
-- ============================================================
-- public read (shared/ folder), authenticated user write to {user_id}/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'podcast-audio',
  'podcast-audio',
  true,  -- public read OK (audio URL 노출됨)
  52428800,  -- 50MB per file
  array['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/L16']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: 'shared/' 폴더는 service_role만 INSERT, '{uid}/' 폴더는 본인만 INSERT
drop policy if exists podcast_audio_user_insert on storage.objects;
create policy podcast_audio_user_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'podcast-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists podcast_audio_user_update on storage.objects;
create policy podcast_audio_user_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'podcast-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists podcast_audio_user_delete on storage.objects;
create policy podcast_audio_user_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'podcast-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- public bucket이라 SELECT는 정책 불필요 (anonymous도 read 가능 — audio URL 자체가 노출되는 모델)

comment on table public.podcast_episodes is '헌법 v3.0 §13의3 — NotebookLM 스타일 자동 생성 팟캐스트';
comment on table public.podcast_progress is '헌법 v3.0 §13의3 4항 — 청취 진척 (재개 가능)';
