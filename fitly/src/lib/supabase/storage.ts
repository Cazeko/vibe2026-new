// 헌법 v3.0 제13조의2 9항 정합 — stem_image_path 호스팅 헬퍼.
// `cards.front_image_path` / `exam_items.stem_image_path` 컬럼은 다음 중 하나의 형태로 저장된다:
//   1. storage path (권장):  "2024/essay/001.png"
//   2. full URL (예외):        "https://example.com/foo.png"
//
// 본 헬퍼는 두 형태 모두 받아 사용자 노출용 public URL을 반환한다.
// 마이그레이션: supabase/migrations/0009_exam_pages_storage.sql

const EXAM_PAGES_BUCKET = "exam-pages";

export function getExamPageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    // server-side에서 env 미설정은 명시적 실패 (헌법 제37조 — 장애 보고)
    if (typeof window === "undefined") {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
    }
    return null;
  }

  const trimmed = path.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${EXAM_PAGES_BUCKET}/${trimmed}`;
}
