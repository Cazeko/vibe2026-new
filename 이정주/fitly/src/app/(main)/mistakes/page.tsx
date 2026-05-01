"use client";

import { useEffect, useState } from "react";
import { UploadCard } from "@/components/feature/ocr/upload-card";
import { MistakeCardList } from "@/components/feature/mistake/mistake-card-list";
import {
  normalizeSavedMistakes,
  type SavedMistake,
} from "@/lib/mistake/normalize";



export default function MistakesPage() {
  const [items, setItems] = useState<SavedMistake[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mistakes")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "조회 실패");
        setItems(normalizeSavedMistakes(data.items ?? []));
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "알 수 없는 오류");
      });
  }, []);

  return (
    <section className="mx-auto w-full max-w-md px-4 py-6 space-y-6 animate-fade-up">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">내 오답</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          업로드하면 자동으로 오답 카드가 저장됩니다.
        </p>
      </header>

      <UploadCard
        onComplete={(r) => {
          setItems((prev) => [...r.saved, ...prev]);
        }}
      />

      {loadError && (
        <p role="alert" className="text-sm text-destructive">
          기존 오답 카드를 불러오지 못했습니다: {loadError}
        </p>
      )}

      <MistakeCardList
        items={items}
        onUpdated={(id, updated) =>
          setItems((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
          )
        }
      />
    </section>
  );
}

