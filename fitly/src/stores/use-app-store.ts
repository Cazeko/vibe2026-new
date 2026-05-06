import { create } from "zustand";
import type { RegionName } from "@/types";

// 헌법 v3.0 제15조 — 지역 교육청 17개 라벨 (선택 입력).
type AppState = {
  selectedRegion: RegionName | null;
  examDate: string | null;
  setRegion: (r: RegionName | null) => void;
  setExamDate: (d: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  selectedRegion: null,
  examDate: null,
  setRegion: (r) => set({ selectedRegion: r }),
  setExamDate: (d) => set({ examDate: d }),
}));
