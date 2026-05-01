"use client";

import { useState } from "react";
import { UploadCard } from "@/components/feature/ocr/upload-card";
import { SitcardList } from "@/components/feature/mistake/sitcard-list";
import type { Sitcard } from "@/types";

export default function MistakesPage() {
  const [sitcards, setSitcards] = useState<Sitcard[]>([]);

  return (
    <section className="mx-auto w-full max-w-md px-4 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">내 오답</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          사진·PDF를 올리면 자동으로 시카드가 만들어집니다.
        </p>
      </header>

      <UploadCard onComplete={(r) => setSitcards(r.sitcards)} />
      <SitcardList items={sitcards} />
    </section>
  );
}
