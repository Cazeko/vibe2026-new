"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MaterialRowItem = {
  id: string;
  name: string;
  meta: string;
  status: string;
};

// DESIGN.md §4.4 — semantic 색은 desaturated 토큰으로.
const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  uploaded: {
    label: "추출 대기",
    tone: "bg-warning/10 text-warning",
  },
  parsed: {
    label: "추출 완료",
    tone: "bg-evergreen/10 text-evergreen",
  },
  failed: {
    label: "추출 실패",
    tone: "bg-error/10 text-error",
  },
};

export function MaterialRow({ item }: { item: MaterialRowItem }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [extracting, setExtracting] = useState(false);
  const [extractedMsg, setExtractedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!confirm(`"${item.name}" 파일을 삭제하시겠습니까?`)) return;
    setError(null);
    start(async () => {
      try {
        const res = await fetch(`/api/materials/${item.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "삭제 실패");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "삭제 실패");
      }
    });
  }

  async function reExtract() {
    setError(null);
    setExtractedMsg(null);
    setExtracting(true);
    try {
      const res = await fetch(`/api/materials/${item.id}/extract`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "추출 실패");
      const saved = data.saved ?? 0;
      setExtractedMsg(
        saved > 0
          ? `${saved}장 학습 카드 추출 완료 — 기출 풀이에서 풀 수 있음`
          : "추출 가능한 카드 없음",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "추출 실패");
    } finally {
      setExtracting(false);
    }
  }

  const statusInfo = STATUS_LABEL[item.status] ?? null;

  return (
    <li className="flex items-center gap-3 rounded-lg border border-rule bg-card px-4 py-3">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-muted-foreground">
        <FileText className="h-4 w-4" aria-hidden />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
          <p className="text-[11px] text-muted-foreground">{item.meta}</p>
          {statusInfo && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-medium ${statusInfo.tone}`}
            >
              {statusInfo.label}
            </span>
          )}
        </div>
        {extractedMsg && (
          <p role="status" className="mt-0.5 text-[10.5px] text-evergreen">
            {extractedMsg}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-0.5 text-[10.5px] text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-evergreen"
        onClick={reExtract}
        disabled={extracting || pending}
        aria-label={item.status === "parsed" ? "다시 추출" : "AI 카드 추출"}
        title={item.status === "parsed" ? "다시 추출" : "AI 카드 추출"}
      >
        {extracting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={remove}
        disabled={pending || extracting}
        aria-label="자료 삭제"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </li>
  );
}
