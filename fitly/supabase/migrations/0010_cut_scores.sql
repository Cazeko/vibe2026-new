-- 0010 — 임용 1차 합격선 (공개 사실 데이터)
-- 헌법 제3조의2 4항 정합 — 추정값/비공개 데이터 금지, 공개된 1차 합격선은 사실 표시 가능.
-- 2차 합격선은 본 테이블에서 의도적으로 보유하지 아니한다 (1차만 — 주인님 명시).
--
-- 시드 출처: 시도교육청 공개 합격선 표 (2024·2025·2026 학년도).
-- verified=false 시작 — OCR 자동 추출 기반이므로 운영자(주인님) 검수 전 UI에 "검수 대기" 표시.

create table if not exists cut_scores (
  region varchar(16) not null,
  year integer not null,
  applied_count integer,
  applicant_count integer,
  competition_ratio numeric(6,3),
  first_round_cut_score numeric(6,2),
  verified boolean not null default false, 
  source_note varchar(64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists cut_scores_region_year_uq
  on cut_scores (region, year);

-- RLS — 모든 인증 사용자에게 read 허용. write는 정책 없음 → service_role 전용.
-- 헌법 제17조 5항(인증 필수) + 제3조의2(공개 사실 데이터) 정합.
alter table cut_scores enable row level security;

drop policy if exists cut_scores_select_authenticated on cut_scores;
create policy cut_scores_select_authenticated
  on cut_scores
  for select
  to authenticated
  using (true);

-- 시드 데이터: 17 지역 × 3 학년도 = 51 row.
-- 광주 2024 / 대전 2024 일부 셀은 OCR 신뢰도가 낮아 NULL 처리.
insert into cut_scores (region, year, applied_count, applicant_count, competition_ratio, first_round_cut_score, verified, source_note) values
-- 2026학년도
('서울', 2026, 195, 863, 3.900, 93.50, false, 'OCR 자동 추출 — 검수 대기'),
('경기', 2026, 995, 2325, 2.340, 80.17, false, 'OCR 자동 추출 — 검수 대기'),
('인천', 2026, 175, 431, 2.460, 81.83, false, 'OCR 자동 추출 — 검수 대기'),
('대구', 2026, 72, 182, 2.530, 83.00, false, 'OCR 자동 추출 — 검수 대기'),
('부산', 2026, 255, 582, 2.290, 83.83, false, 'OCR 자동 추출 — 검수 대기'),
('광주', 2026, 31, 136, 4.390, 91.50, false, 'OCR 자동 추출 — 검수 대기'),
('대전', 2026, 36, 47, 1.310, 91.67, false, 'OCR 자동 추출 — 검수 대기'),
('울산', 2026, 28, 144, 5.140, 89.17, false, 'OCR 자동 추출 — 검수 대기'),
('세종', 2026, 61, 142, 2.330, 85.83, false, 'OCR 자동 추출 — 검수 대기'),
('강원', 2026, 119, 264, 2.220, 75.00, false, 'OCR 자동 추출 — 검수 대기'),
('충북', 2026, 261, 592, 2.270, 75.67, false, 'OCR 자동 추출 — 검수 대기'),
('충남', 2026, 123, 290, 2.360, 75.67, false, 'OCR 자동 추출 — 검수 대기'),
('전북', 2026, 53, 111, 2.090, 77.17, false, 'OCR 자동 추출 — 검수 대기'),
('전남', 2026, 100, 266, 2.510, 82.00, false, 'OCR 자동 추출 — 검수 대기'),
('경북', 2026, 72, 145, 2.010, 75.67, false, 'OCR 자동 추출 — 검수 대기'),
('경남', 2026, 218, 517, 2.370, 80.00, false, 'OCR 자동 추출 — 검수 대기'),
('제주', 2026, 55, 116, 2.150, 79.50, false, 'OCR 자동 추출 — 검수 대기'),
-- 2025학년도
('서울', 2025, 244, 3262, 13.360, 77.50, false, 'OCR 자동 추출 — 검수 대기'),
('경기', 2025, 1626, 3146, 1.930, 77.50, false, 'OCR 자동 추출 — 검수 대기'),
('인천', 2025, 206, 397, 1.920, 74.70, false, 'OCR 자동 추출 — 검수 대기'),
('대구', 2025, 67, 113, 1.680, 71.80, false, 'OCR 자동 추출 — 검수 대기'),
('부산', 2025, 379, 786, 2.070, 81.30, false, 'OCR 자동 추출 — 검수 대기'),
('광주', 2025, 39, 121, 3.100, 89.50, false, 'OCR 자동 추출 — 검수 대기'),
('대전', 2025, 39, 84, 2.160, 79.00, false, 'OCR 자동 추출 — 검수 대기'),
('울산', 2025, 41, 156, 3.800, 89.50, false, 'OCR 자동 추출 — 검수 대기'),
('세종', 2025, 18, 64, 3.550, 73.50, false, 'OCR 자동 추출 — 검수 대기'),
('강원', 2025, 168, 263, 1.570, 68.00, false, 'OCR 자동 추출 — 검수 대기'),
('충북', 2025, 293, 530, 1.810, 66.50, false, 'OCR 자동 추출 — 검수 대기'),
('충남', 2025, 230, 465, 2.020, 78.50, false, 'OCR 자동 추출 — 검수 대기'),
('전북', 2025, 88, 191, 2.170, 65.00, false, 'OCR 자동 추출 — 검수 대기'),
('전남', 2025, 92, 245, 2.660, 75.00, false, 'OCR 자동 추출 — 검수 대기'),
('경북', 2025, 117, 173, 1.480, 64.00, false, 'OCR 자동 추출 — 검수 대기'),
('경남', 2025, 244, 470, 1.930, 67.50, false, 'OCR 자동 추출 — 검수 대기'),
('제주', 2025, 162, 285, 1.760, 66.50, false, 'OCR 자동 추출 — 검수 대기'),
-- 2024학년도 (광주·대전은 OCR 신뢰도 낮은 셀 — first_round_cut_score NULL)
('서울', 2024, 101, 452, 4.500, 89.50, false, 'OCR 자동 추출 — 검수 대기'),
('경기', 2024, 1220, 2942, 2.400, 78.83, false, 'OCR 자동 추출 — 검수 대기'),
('인천', 2024, 147, 380, 2.600, 88.50, false, 'OCR 자동 추출 — 검수 대기'),
('대구', 2024, 67, 87, 1.300, 88.50, false, 'OCR 자동 추출 — 검수 대기'),
('부산', 2024, 305, 696, 2.300, 86.50, false, 'OCR 자동 추출 — 검수 대기'),
('광주', 2024, NULL, NULL, NULL, NULL, false, 'OCR 신뢰도 낮음 — 운영자 정정 필요'),
('대전', 2024, NULL, NULL, NULL, NULL, false, 'OCR 신뢰도 낮음 — 운영자 정정 필요'),
('울산', 2024, 17, 86, 5.060, 88.83, false, 'OCR 자동 추출 — 검수 대기'),
('세종', 2024, 9, 53, 5.890, 86.50, false, 'OCR 자동 추출 — 검수 대기'),
('강원', 2024, 89, 187, 2.100, 81.00, false, 'OCR 자동 추출 — 검수 대기'),
('충북', 2024, 198, 364, 1.840, 80.50, false, 'OCR 자동 추출 — 검수 대기'),
('충남', 2024, 164, 331, 2.020, 82.00, false, 'OCR 자동 추출 — 검수 대기'),
('전북', 2024, 53, 100, 1.890, 78.50, false, 'OCR 자동 추출 — 검수 대기'),
('전남', 2024, 80, 199, 2.490, 81.00, false, 'OCR 자동 추출 — 검수 대기'),
('경북', 2024, 76, 187, 2.460, 79.50, false, 'OCR 자동 추출 — 검수 대기'),
('경남', 2024, 200, 449, 2.250, 78.50, false, 'OCR 자동 추출 — 검수 대기'),
('제주', 2024, 153, 306, 2.000, 81.00, false, 'OCR 자동 추출 — 검수 대기')
on conflict (region, year) do update set
  applied_count = excluded.applied_count,
  applicant_count = excluded.applicant_count,
  competition_ratio = excluded.competition_ratio,
  first_round_cut_score = excluded.first_round_cut_score,
  source_note = excluded.source_note,
  updated_at = now();
