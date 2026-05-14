-- Fitly · 0017_multi_page_stem
-- 헌법 v3.3 제13조의2 9항 + v3.5.1 제16조 (사용자 보고 2026-05-14) — 한 문항이 여러
-- PDF 페이지에 걸친 경우 모든 페이지를 표시할 수 있도록 stem_image_paths 배열
-- 컬럼 추가. 기존 stem_image_path 컬럼은 호환성 유지 + 첫 페이지 fallback.

ALTER TABLE exam_items
  ADD COLUMN IF NOT EXISTS stem_image_paths jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS front_image_paths jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 기존 row 백필 — 단일 stem_image_path 가 있으면 paths 배열의 첫 원소로 보존.
UPDATE exam_items
SET stem_image_paths = jsonb_build_array(stem_image_path)
WHERE jsonb_array_length(stem_image_paths) = 0
  AND stem_image_path IS NOT NULL;

UPDATE cards
SET front_image_paths = jsonb_build_array(front_image_path)
WHERE jsonb_array_length(front_image_paths) = 0
  AND front_image_path IS NOT NULL;
