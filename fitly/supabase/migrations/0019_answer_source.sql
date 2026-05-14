-- 0019_answer_source.sql — 정답·해설 4계층 출처 enum
--
-- 헌법 v1.8 제30조의2 정합 — 정답 출처 4계층 모델:
--   official            : 학교 공시 정답 또는 1차 출처
--   ai_estimate         : Gemini 가 본문에서 추정 (콜드 스타트)
--   user_self_corrected : 본인이 자기 카드를 직접 정정 (단일 의견)
--   crowd_verified      : 2명 이상 서로 다른 사용자가 동일 답을 제출
--
-- 코드리뷰 M4 (2026-05-15) — 종전 `verified_answer: boolean` 단일 플래그는
-- official / ai_estimate 두 단계만 표현하고 user_self_corrected · crowd_verified
-- 단계가 식별되지 않던 회귀. 본 마이그레이션으로 4계층 enum 컬럼을 추가하며,
-- 기존 verified_answer 컬럼은 backward compat 유지 (운영 영향 0).

-- ============================================================
-- 1) exam_items.answer_source
-- ============================================================
alter table public.exam_items
  add column if not exists answer_source varchar(24) not null default 'ai_estimate'
  check (answer_source in (
    'official', 'ai_estimate', 'user_self_corrected', 'crowd_verified'
  ));

-- 기존 verified_answer 매핑: true → official, false → ai_estimate
update public.exam_items
  set answer_source = 'official'
  where verified_answer = true and answer_source = 'ai_estimate';

-- ============================================================
-- 2) cards.answer_source
-- ============================================================
alter table public.cards
  add column if not exists answer_source varchar(24) not null default 'ai_estimate'
  check (answer_source in (
    'official', 'ai_estimate', 'user_self_corrected', 'crowd_verified'
  ));

update public.cards
  set answer_source = 'official'
  where verified_answer = true and answer_source = 'ai_estimate';

-- ============================================================
-- 3) 인덱스 (운영자 화면 정렬·필터용)
-- ============================================================
create index if not exists exam_items_answer_source_idx
  on public.exam_items (answer_source);

create index if not exists cards_answer_source_idx
  on public.cards (answer_source);

-- ============================================================
-- 4) 비고
-- ============================================================
-- markAnswerVerified server action (lib/seed-review/actions.ts) 은 본 마이그레이션
-- 이후 자동으로 answer_source='official' 도 갱신한다. unmarkAnswerVerified 는
-- ai_estimate 로 복귀. user_self_corrected / crowd_verified 는 Phase 2 의 사용자
-- 정정 / 동료 검증 server action 도입 시 갱신된다.
