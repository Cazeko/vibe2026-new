export type UniversityName =
  | "한양"
  | "중앙"
  | "성균관"
  | "경희"
  | "이화"
  | "서강"
  | "홍익"
  | "동국"
  | "건국"
  | "숭실";

export type {
  Cutoffs,
  Weights,
  UserSectionScores,
  SectionKey,
} from "@/lib/fit/score";

export type Sitcard = {
  question: string;
  choices?: string[];
  answer?: string;
  explanation?: string;
  keywords: string[];
};
