"use client";

import Link from "next/link";
import { Bookmark, Star, HelpCircle, ListFilter } from "lucide-react";
import type { CardType } from "@/types";

// 백승환 #9 (2026-05-15) — 학습 트랙 마크 필터 chips.
// URL ?mark=star|bookmark|unsure 로 필터링. null 은 전체.
// 학습 본업 다듬기(§16) — 기존 트랙 위계 유지 + 카드 마크 데이터 활용.

type Props = {
  track: CardType;
  active: "bookmark" | "star" | "unsure" | null;
};

type FilterKey = "bookmark" | "star" | "unsure" | null;
const FILTERS: { key: FilterKey; label: string; Icon: typeof Bookmark }[] = [
  { key: null, label: "전체", Icon: ListFilter },
  { key: "bookmark", label: "북마크", Icon: Bookmark },
  { key: "star", label: "별표", Icon: Star },
  { key: "unsure", label: "모르겠음", Icon: HelpCircle },
];

export function TrackFilters({ track, active }: Props) {
  return (
    <nav
      aria-label="마크 필터"
      className="flex items-center gap-1.5 flex-wrap"
    >
      {FILTERS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        const href =
          key === null
            ? `/study/${track}`
            : `/study/${track}?mark=${key}`;
        return (
          <Link
            key={String(key)}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 ${
              isActive
                ? "bg-evergreen/10 border-evergreen text-evergreen font-semibold"
                : "border-rule text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <Icon className="h-3 w-3" aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
