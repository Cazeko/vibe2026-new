import { create } from "zustand";
import type { UniversityName } from "@/types";

type AppState = {
  selectedUniversity: UniversityName | null;
  examDate: string | null;
  setUniversity: (u: UniversityName | null) => void;
  setExamDate: (d: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  selectedUniversity: null,
  examDate: null,
  setUniversity: (u) => set({ selectedUniversity: u }),
  setExamDate: (d) => set({ examDate: d }),
}));
