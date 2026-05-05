import type { UniversityName } from "@/types";

// 헌법 v2.0 제15조 — 학교 라벨은 시연용 *예시*. 합격 컷·평균은 비공개이므로
// Fitly 는 그 데이터를 보유하지 아니한다 (제3조의2 정합).
// 본 시드는 *공개된 시험 정보* 만 담는다 — 시험 시기·과목 구성·문항 수.

export type ExamSectionInfo = {
  key: "vocab" | "grammar" | "reading";
  label: string;
  approxQuestions?: number;   // 대략적 문항 수 (공개 자료 기준 — 정확치 보장 X)
};

export type UniversityInfo = {
  name: UniversityName;
  shortName: string;          // "한양대" 등
  examMonth?: string;         // "12월" 등 (정확 일자는 매년 학교 공지)
  totalQuestions?: number;    // 대략적 총 문항 수
  sections?: ExamSectionInfo[];
  note?: string;
};

// 시연용 라벨이며, 합격 컷·가중치는 보유하지 아니한다.
// 정확한 시험 정보는 매년 학교 공지를 따른다.
export const UNIVERSITY_SEEDS: UniversityInfo[] = [
  {
    name: "한양",
    shortName: "한양대",
    examMonth: "12월",
    totalQuestions: 40,
    sections: [
      { key: "vocab", label: "어휘", approxQuestions: 12 },
      { key: "grammar", label: "문법", approxQuestions: 10 },
      { key: "reading", label: "독해", approxQuestions: 18 },
    ],
  },
  { name: "중앙", shortName: "중앙대", examMonth: "12월", totalQuestions: 40 },
  { name: "성균관", shortName: "성균관대", examMonth: "12월", totalQuestions: 40 },
  { name: "경희", shortName: "경희대", examMonth: "12월", totalQuestions: 40 },
  { name: "이화", shortName: "이화여대", examMonth: "12월", totalQuestions: 40 },
  { name: "서강", shortName: "서강대", examMonth: "12월", totalQuestions: 40 },
  { name: "홍익", shortName: "홍익대", examMonth: "1월", totalQuestions: 40 },
  { name: "동국", shortName: "동국대", examMonth: "12월", totalQuestions: 40 },
  { name: "건국", shortName: "건국대", examMonth: "1월", totalQuestions: 40 },
  { name: "숭실", shortName: "숭실대", examMonth: "1월", totalQuestions: 40 },
];

export function getUniversityInfo(
  name: UniversityName | null,
): UniversityInfo | null {
  if (!name) return null;
  return UNIVERSITY_SEEDS.find((u) => u.name === name) ?? null;
}
