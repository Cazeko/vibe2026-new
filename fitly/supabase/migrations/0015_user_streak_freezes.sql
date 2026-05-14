-- 0015_user_streak_freezes.sql — 잔디(Streak) 얼리기 (헌법 v3.5.1 제16조 정합)
--
-- 본 마이그레이션은 사용자가 학습 못한 날의 streak 끊김을 보호하는 freeze 토큰을
-- 보존한다. 듀오링고 차용 retention 장치이며 기존 streak 계산 시스템의 보강이라
-- 신규 모듈이 아닌 streak 다듬기로 분류된다 (시행규칙 32 제34조 정합).
--
-- 모델 — (user_id, frozen_date) 1행. frozen_date 는 사용자가 freeze 를 적용한
--   날짜 (보통 오늘). streak 계산 시 frozen_date 도 학습일로 인정된다.
-- 상한 — 30일 윈도우 내 2개 (application layer 에서 enforce, DB unique 만).
-- RLS — 본인만 (헌법 §17 보안).

-- ============================================================
-- 1) 테이블
-- ============================================================
create table if not exists public.user_streak_freezes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  frozen_date date not null,
  created_at timestamptz not null default now(),
  constraint user_streak_freezes_user_date_uq unique (user_id, frozen_date)
);

-- ============================================================
-- 2) 인덱스
-- ============================================================
create index if not exists user_streak_freezes_user_date_idx
  on public.user_streak_freezes (user_id, frozen_date desc);

-- ============================================================
-- 3) RLS
-- ============================================================
alter table public.user_streak_freezes enable row level security;

drop policy if exists user_streak_freezes_select on public.user_streak_freezes;
create policy user_streak_freezes_select on public.user_streak_freezes
  for select using (auth.uid() = user_id);

drop policy if exists user_streak_freezes_insert on public.user_streak_freezes;
create policy user_streak_freezes_insert on public.user_streak_freezes
  for insert with check (auth.uid() = user_id);

drop policy if exists user_streak_freezes_delete on public.user_streak_freezes;
create policy user_streak_freezes_delete on public.user_streak_freezes
  for delete using (auth.uid() = user_id);
