// 시험지 session enum 라벨 — 5곳에서 중복되던 매핑을 단일 source.
// examPapers.session 값: 'essay' | 'A' | 'B' | 'combined' (헌법 v3.1 + kice_pdfs/ README 정합).
//   - essay:    교직논술 (2014학년도~)
//   - A·B:      교육과정 A·B (2014학년도~)
//   - combined: 통합 PDF (객관식 시대 2002~2013, 단일본 — 헌법 v3.5 제18조의3)

const SESSION_LABEL: Record<string, string> = {
  essay: "교직논술",
  A: "교육과정 A",
  B: "교육과정 B",
  combined: "통합",
};

export function getSessionLabel(session: string | null | undefined): string {
  if (!session) return "—";
  return SESSION_LABEL[session] ?? session;
}
