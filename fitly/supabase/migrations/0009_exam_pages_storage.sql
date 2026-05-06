-- Fitly · 0009_exam_pages_storage
-- 헌법 v3.0 제13조의2 9항 (v3.3 본문 정확성 정책) 정합 — stem_image_path 호스팅.
-- KICE 공개 기출 PDF 페이지 PNG는 운영자가 시드 시 본 버킷에 업로드하고
-- 사용자에게는 public read로 노출된다. 시드 데이터는 모든 사용자 공통 (제13조의2 6항).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exam-pages',
  'exam-pages',
  true,                                          -- public read (KICE 공개 자료)
  10485760,                                      -- 10MB per file
  ARRAY['image/png', 'image/webp', 'image/jpeg'] -- pdftocairo 출력 + 압축 변형 허용
)
ON CONFLICT (id) DO NOTHING;

-- 정책: anon/authenticated public read.
-- 업로드/삭제는 service_role 키로만 (운영자 시드 시 — 헌법 제18조 1항 단서 정합).
DROP POLICY IF EXISTS "exam_pages_public_read" ON storage.objects;
CREATE POLICY "exam_pages_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exam-pages');

COMMENT ON POLICY "exam_pages_public_read" ON storage.objects IS
  '헌법 v3.0 제13조의2 6항 — 시드 시험지 PNG는 모든 사용자에게 동일 노출.';
