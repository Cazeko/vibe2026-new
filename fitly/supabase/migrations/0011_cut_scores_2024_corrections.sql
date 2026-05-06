-- 0011 — 광주·대전 2024학년도 1차 합격선 정정
-- 0010에서 OCR 신뢰도 낮아 NULL 처리했던 두 row를 주인님 검수 자료로 갱신.
-- verified=true (다른 row는 여전히 OCR 자동 추출이므로 false).

update cut_scores
set
  applied_count = 5,
  applicant_count = 46,
  competition_ratio = 9.200,
  first_round_cut_score = 97.00,
  verified = true,
  source_note = '주인님 검수 — 시도교육청 발표',
  updated_at = now()
where region = '광주' and year = 2024;

update cut_scores
set
  applied_count = 9,
  applicant_count = 57,
  competition_ratio = 6.300,
  first_round_cut_score = 95.70,
  verified = true,
  source_note = '주인님 검수 — 시도교육청 발표',
  updated_at = now()
where region = '대전' and year = 2024;
