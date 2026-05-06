-- Fitly · 0009_exam_pages_storage (revised — RLS policy 권한 회피)
-- 헌법 v3.0 제13조의2 9항 (v3.3 본문 정확성 정책) 정합 — stem_image_path 호스팅.
-- KICE 공개 기출 PDF 페이지 PNG는 운영자가 시드 시 본 버킷에 업로드하고
-- 사용자에게는 public read로 노출된다. 시드 데이터는 모든 사용자 공통 (제13조의2 6항).

-- public=true 버킷이면 storage.objects의 default SELECT 정책이 자동 적용되므로
-- CREATE POLICY를 추가할 필요가 없다.
-- (CREATE POLICY ON storage.objects는 supabase_storage_admin 권한 필요 →
--  Supabase SQL Editor의 postgres role로는 42501 must be owner of relation
--  objects 에러. 본 마이그레이션은 버킷 등록만 수행.)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exam-pages',
  'exam-pages',
  true,                                          -- public read (KICE 공개 자료)
  10485760,                                      -- 10MB per file
  ARRAY['image/png', 'image/webp', 'image/jpeg'] -- pdftocairo 출력 + 압축 변형 허용
)
ON CONFLICT (id) DO NOTHING;

-- 업로드는 service_role 키로 수행 (scripts/seed/upload-pages.mjs).
-- service_role은 RLS를 우회하므로 storage.objects 정책 없이도 INSERT/DELETE 가능.
