-- 0018_card_reports.sql — 사용자 AI 답안 신고 채널
--
-- 헌법 시행규칙 33 제35조 백업 매트릭스 정합:
--   "AI 모범답안 품질 저하 → verified:false 배지 + 사용자 신고 채널 + 운영자 검토 큐"
-- 종전 verified 배지 + 운영자 큐는 구현되었으나, *사용자가 직접 오류를 신고*하는
-- 채널이 부재했음 (코드리뷰 2026-05-15 C.H2).
--
-- 헌법 §3의2 정직성 — 학습자가 잘못된 모범답안·해설을 즉시 보고할 수 있도록 함으로써
-- 정직성 원칙의 양방향 보강.

-- ============================================================
-- 1) 테이블
-- ============================================================
create table if not exists public.card_reports (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 카테고리 — 사용자가 선택. 운영자 분류 효율 + 누적 통계 정합.
  --   answer_wrong:        모범답안 자체가 틀림
  --   explanation_unclear: 해설이 불명확·생략됨
  --   irrelevant:          본문과 무관한 답안
  --   other:               기타 (detail 필수)
  category varchar(32) not null check (category in (
    'answer_wrong', 'explanation_unclear', 'irrelevant', 'other'
  )),
  -- 자유 텍스트 상세 (선택, 0~1000자). other 는 필수이나 application layer 검증.
  detail text,
  -- 처리 상태 — 운영자가 검토 후 갱신.
  status varchar(16) not null default 'pending' check (status in (
    'pending', 'reviewed', 'dismissed'
  )),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

-- ============================================================
-- 2) 인덱스
-- ============================================================
-- 카드별 신고 누계 조회 (admin/seed-review 우선 정렬용)
create index if not exists card_reports_card_idx
  on public.card_reports (card_id);

-- pending 큐 정렬 (운영자 화면)
create index if not exists card_reports_status_created_idx
  on public.card_reports (status, created_at desc);

-- 사용자 본인 신고 이력 조회
create index if not exists card_reports_user_idx
  on public.card_reports (user_id, created_at desc);

-- ============================================================
-- 3) RLS
-- ============================================================
alter table public.card_reports enable row level security;

-- 본인 신고만 INSERT
drop policy if exists card_reports_owner_insert on public.card_reports;
create policy card_reports_owner_insert on public.card_reports
  for insert with check (auth.uid() = user_id);

-- 본인 신고만 SELECT (다른 사용자 신고 노출 차단)
drop policy if exists card_reports_owner_select on public.card_reports;
create policy card_reports_owner_select on public.card_reports
  for select using (auth.uid() = user_id);

-- UPDATE / DELETE 는 service_role 만 (운영자 화면 application layer 가드 정합)
