"use client";

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Sitcard } from "@/types";

type SavedMistake = Sitcard & { id: string; createdAt: string };

type UploadCardProps = {
  onComplete: (result: {
    text: string;
    sitcards: Sitcard[];
    saved: SavedMistake[];
  }) => void;
};

export function UploadCard({ onComplete }: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!file) return;
    setStatus("loading");
    setError(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/ocr", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "업로드 실패");
      onComplete({
        text: data.text ?? "",
        sitcards: data.sitcards ?? [],
        saved: normalize(data.saved ?? []),
      });
      setFile(null);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
      setStatus("error");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>오답 노트 업로드</CardTitle>
        <p className="text-xs text-muted-foreground">
          시험지 사진(PNG·JPG·WebP) 또는 PDF · 최대 10MB
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={status === "loading"}
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!file || status === "loading"}
          className="w-full"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              분석 중…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden />
              분석 시작
            </>
          )}
        </Button>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
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
