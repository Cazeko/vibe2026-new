"use client";

import { useEffect, useState } from "react";
import { UploadCard } from "@/components/feature/ocr/upload-card";
import { SitcardList } from "@/components/feature/mistake/sitcard-list";
import type { Sitcard } from "@/types";

type SavedMistake = Sitcard & { id: string; createdAt: string };

export default function MistakesPage() {
  const [items, setItems] = useState<SavedMistake[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mistakes")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "조회 실패");
        setItems(normalize(data.items ?? []));
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "알 수 없는 오류");
      });
  }, []);

  return (
    <section className="mx-auto w-full max-w-md px-4 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">내 오답</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          업로드하면 자동으로 시카드가 저장됩니다.
        </p>
      </header>

      <UploadCard
        onComplete={(r) => {
          const fresh = normalize(r.saved ?? []);
          setItems((prev) => [...fresh, ...prev]);
        }}
      />

      {loadError && (
        <p role="alert" className="text-sm text-destructive">
          기존 시카드를 불러오지 못했습니다: {loadError}
        </p>
      )}

      <SitcardList items={items} />
    </section>
  );
}

function normalize(rows: Array<Record<string, unknown>>): SavedMistake[] {
  return rows.map((r) => ({
    id: String(r.id ?? ""),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    question: String(r.question ?? ""),
    choices: Array.isArray(r.choices) ? (r.choices as string[]) : undefined,
    answer: typeof r.answer === "string" ? r.answer : undefined,
    explanation:
      typeof r.explanation === "string" ? r.explanation : undefined,
    keywords: Array.isArray(r.keywords) ? (r.keywords as string[]) : [],
  }));
}
