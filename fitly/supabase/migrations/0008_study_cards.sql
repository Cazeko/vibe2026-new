-- 헌법 v1.11 제13조의2 정합 — StudyCard 정식 분리.
-- /materials 업로드 PDF 의 추출 결과는 본 테이블로 저장된다.
-- /mistakes (사용자가 푼 시험지 사진) 와 별개의 카드 종류.
-- SRS 큐는 mistakes/study_cards/vocab_cards 3종 통합(제13조의2 1항).

create table if not exists public.study_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  material_id uuid references public.materials(id) on delete set null,
  question text not null,
  choices jsonb,
  answer text,
  explanation text,
  keywords jsonb not null default '[]'::jsonb,
  question_type varchar(24),
  -- 헌법 제30조의2 — 정답·해설 출처 4계층.
  answer_source varchar(24) not null default 'ai_estimate'
    check (answer_source in ('official','ai_estimate','user_self_corrected','crowd_verified')),
  -- 헌법 제19조 — ts-fsrs SRS 상태(JSON 직렬화).
  srs_state jsonb,
  due_at timestamptz not null default now(),
  review_count integer not null default 0,
  lapse_count integer not null default 0,
  last_grade varchar(8),
  created_at timestamptz not null default now()
);

create index if not exists study_cards_user_due_idx
  on public.study_cards (user_id, due_at);
create index if not exists study_cards_user_material_idx
  on public.study_cards (user_id, material_id);
create index if not exists study_cards_user_qtype_idx
  on public.study_cards (user_id, question_type);

alter table public.study_cards enable row level security;

drop policy if exists "study_cards_select_own" on public.study_cards;
create policy "study_cards_select_own"
  on public.study_cards for select
  using (auth.uid() = user_id);

drop policy if exists "study_cards_insert_own" on public.study_cards;
create policy "study_cards_insert_own"
  on public.study_cards for insert
  with check (auth.uid() = user_id);

drop policy if exists "study_cards_update_own" on public.study_cards;
create policy "study_cards_update_own"
  on public.study_cards for update
  using (auth.uid() = user_id);

drop policy if exists "study_cards_delete_own" on public.study_cards;
create policy "study_cards_delete_own"
  on public.study_cards for delete
  using (auth.uid() = user_id);
