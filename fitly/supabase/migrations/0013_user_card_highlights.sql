-- 0013_user_card_highlights.sql — 사용자 형광펜/밑줄 (헌법 v3.5.1 제16조 정합)
--
-- 본 마이그레이션은 풀이/키워드/오답 트랙 카드 본문(back_md/front_text)에 대한
-- 사용자별 형광펜·밑줄 어노테이션을 보존한다. 종이 회독 인터랙션의 디지털 이식이며,
-- 신규 모듈이 아닌 카드 본문 인터랙션 다듬기로 분류된다 (시행규칙 32 제34조 정합).
--
-- anchor 전략 — quote + prefix + suffix.
--   marker offset 은 마크다운 sanitize(ZWSP 삽입)로 불안정하므로 채택하지 아니한다.
--   prefix(앞 ≤20자)·suffix(뒤 ≤20자) 컨텍스트로 unique match 보장한다.
--
-- RLS — 본인만 select/insert/delete (헌법 §17 보안, 헌법 §3 사용자 자료 보호 정합).

-- ============================================================
-- 1) 테이블
-- ============================================================
create table if not exists public.user_card_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  surface varchar(16) not null check (surface in ('back_md', 'front_text')),
  quote text not null check (char_length(quote) between 1 and 2000),
  prefix text not null default '',
  suffix text not null default '',
  color varchar(16) not null check (color in ('yellow', 'green', 'pink', 'underline')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2) 인덱스
-- ============================================================
create index if not exists user_card_highlights_user_card_idx
  on public.user_card_highlights (user_id, card_id);

create index if not exists user_card_highlights_created_idx
  on public.user_card_highlights (user_id, created_at desc);

-- ============================================================
-- 3) RLS
-- ============================================================
alter table public.user_card_highlights enable row level security;

drop policy if exists user_card_highlights_select on public.user_card_highlights;
create policy user_card_highlights_select on public.user_card_highlights
  for select
  using (auth.uid() = user_id);

drop policy if exists user_card_highlights_insert on public.user_card_highlights;
create policy user_card_highlights_insert on public.user_card_highlights
  for insert
  with check (auth.uid() = user_id);

drop policy if exists user_card_highlights_delete on public.user_card_highlights;
create policy user_card_highlights_delete on public.user_card_highlights
  for delete
  using (auth.uid() = user_id);

-- update 는 의도적으로 정책 미정의 — 색 변경은 delete + insert 로 단순화.
