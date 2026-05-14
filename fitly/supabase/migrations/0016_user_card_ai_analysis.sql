-- 0016_user_card_ai_analysis.sql — AI 서술형 학습 워크스페이스 분석 캐시
-- (헌법 v3.5.1 제16조 + 시행규칙 32 제34조 — 풀이 트랙 다듬기 해석)
--
-- 2026-05-14 brainstorming PR 2/6. 풀이/오답 트랙 채점 후 AI(Gemini 3.0 Flash)
-- 정성 분석(강점·보완점·누락 키워드·키워드 비교·답안 diff)을 사용자별·답안별로
-- 캐시한다. attempt_hash(SHA-1, 답안 정규화 후) 단위로 unique — 동일 답안을
-- 재제출해도 LLM 재호출 0회.
--
-- 정합 사항
--   - 헌법 제3조의2 (정직성) — 점수 표기 X. overview_json 은 정성 피드백만.
--   - 헌법 제18조 (AI 모델) — model 컬럼에 모델 ID 보존 (감사 추적).
--   - RLS — 본인만 select/insert/update/delete (헌법 §17 보안).

-- ============================================================
-- 1) 테이블
-- ============================================================
create table if not exists public.user_card_ai_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  -- 답안 정규화 후 SHA-1 hex. 40자 고정.
  attempt_hash varchar(40) not null check (char_length(attempt_hash) = 40),
  -- 정성 피드백 — { strengths: string[], improvements: string[], missing_keywords: string[] }
  overview_json jsonb not null default '{}'::jsonb,
  -- 키워드 매칭 — { reference: { text, matched }[] }
  keywords_json jsonb not null default '{}'::jsonb,
  -- 답안 diff — { segments: { type: "common"|"missing"|"extra", text }[] }
  diff_json jsonb not null default '{}'::jsonb,
  -- LLM 모델 ID (gemini-3.0-flash / gemini-3.1-pro-preview 등)
  model varchar(64) not null,
  created_at timestamptz not null default now(),
  constraint user_card_ai_analysis_uq unique (user_id, card_id, attempt_hash)
);

-- ============================================================
-- 2) 인덱스
-- ============================================================
create index if not exists user_card_ai_analysis_user_card_idx
  on public.user_card_ai_analysis (user_id, card_id);

create index if not exists user_card_ai_analysis_user_created_idx
  on public.user_card_ai_analysis (user_id, created_at);

-- ============================================================
-- 3) RLS
-- ============================================================
alter table public.user_card_ai_analysis enable row level security;

drop policy if exists user_card_ai_analysis_select on public.user_card_ai_analysis;
create policy user_card_ai_analysis_select on public.user_card_ai_analysis
  for select using (auth.uid() = user_id);

drop policy if exists user_card_ai_analysis_insert on public.user_card_ai_analysis;
create policy user_card_ai_analysis_insert on public.user_card_ai_analysis
  for insert with check (auth.uid() = user_id);

drop policy if exists user_card_ai_analysis_update on public.user_card_ai_analysis;
create policy user_card_ai_analysis_update on public.user_card_ai_analysis
  for update using (auth.uid() = user_id);

drop policy if exists user_card_ai_analysis_delete on public.user_card_ai_analysis;
create policy user_card_ai_analysis_delete on public.user_card_ai_analysis
  for delete using (auth.uid() = user_id);
