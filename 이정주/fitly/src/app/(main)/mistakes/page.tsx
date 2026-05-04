"use client";

import { useEffect, useState } from "react";
import { UploadCard } from "@/components/feature/ocr/upload-card";
import { MistakeCardList } from "@/components/feature/mistake/mistake-card-list";
import { PageHeader } from "@/components/shared/page-header";
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
    <div className="min-h-screen pb-10">
      <PageHeader
        title="오답 노트"
        subtitle="시험지 사진·PDF를 업로드하면 자동으로 오답 카드가 저장됩니다."
      />
      <div className="px-8 grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-1">
          <UploadCard
            onComplete={(r) => {
              setItems((prev) => [...r.saved, ...prev]);
            }}
          />
          {loadError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              기존 오답 카드를 불러오지 못했습니다: {loadError}
            </p>
          )}
        </div>

        <div className="xl:col-span-2">
          <MistakeCardList
            items={items}
            onUpdated={(id, updated) =>
              setItems((prev) =>
                prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

