// 답안·해설 markdown 정제 — react-markdown 풀 렌더 대신 marker만 제거.
// AI 생성 답안에 ###·**·--- 같은 markdown marker가 raw text로 노출되어
// 가독성을 해치는 문제 해소. 의미는 보존(헤더는 줄바꿈, 굵게는 그대로 텍스트).

export function cleanMarkdown(md: string | null | undefined): string {
  if (!md) return "";
  return md
    // 헤더 (#·##·###·####·#####·######)
    .replace(/^#{1,6}\s+/gm, "")
    // 굵게 (**text** 또는 __text__)
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    // 기울임 (*text* 또는 _text_) — 이중 *는 위에서 처리됨
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, "$1")
    // 인라인 코드 (`text`)
    .replace(/`([^`]+)`/g, "$1")
    // 수평 구분선 (--- 또는 ***)
    .replace(/^[-*]{3,}\s*$/gm, "")
    // 불릿 리스트 (- · * · +) → •
    .replace(/^\s*[-*+]\s+/gm, "• ")
    // 번호 리스트 마커는 보존 (1. 2. 등)
    // 빈 줄 3개 이상 → 2개로 압축
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
