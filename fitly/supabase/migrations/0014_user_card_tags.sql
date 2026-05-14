-- 0014_user_card_tags.sql — 사용자 커스텀 해시태그 (헌법 v3.5.1 제16조 정합)
--
-- 본 마이그레이션은 카드별 사용자 정의 해시태그 (#교수법 #암기필수 #질문예정 등)
-- 를 보존한다. 기존 다시/어려움/쉬움 자가 채점 평가에 부가되는 메타 인터랙션이며
-- 신규 모듈이 아닌 카드 메타 다듬기로 분류된다 (시행규칙 32 제34조 정합).
--
-- 다중 row 모델 — 카드당 태그 N개 (상한은 application layer 에서 12개로 제한).
-- (user_id, card_id, tag) 복합 unique 로 중복 방지.
-- RLS — 본인만 select/insert/delete (헌법 §17 보안).

-- ============================================================
-- 1) 테이블
-- ============================================================
create table if not exists public.user_card_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  tag varchar(32) not null check (char_length(tag) between 1 and 32),
  created_at timestamptz not null default now(),
  constraint user_card_tags_user_card_tag_uq unique (user_id, card_id, tag)
);

-- ============================================================
-- 2) 인덱스
-- ============================================================
create index if not exists user_card_tags_user_card_idx
  on public.user_card_tags (user_id, card_id);

create index if not exists user_card_tags_user_tag_idx
  on public.user_card_tags (user_id, tag);

-- ============================================================
-- 3) RLS
-- ============================================================
alter table public.user_card_tags enable row level security;

drop policy if exists user_card_tags_select on public.user_card_tags;
create policy user_card_tags_select on public.user_card_tags
  for select using (auth.uid() = user_id);

drop policy if exists user_card_tags_insert on public.user_card_tags;
create policy user_card_tags_insert on public.user_card_tags
  for insert with check (auth.uid() = user_id);

drop policy if exists user_card_tags_delete on public.user_card_tags;
create policy user_card_tags_delete on public.user_card_tags
  for delete using (auth.uid() = user_id);
