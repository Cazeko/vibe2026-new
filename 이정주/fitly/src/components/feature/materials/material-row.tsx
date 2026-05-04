"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MaterialRowItem = {
  id: string;
  name: string;
  meta: string;
  status: string;
};

export function MaterialRow({ item }: { item: MaterialRowItem }) {
  const router = useRouter();
  const [pending, start] = useTransition();
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

  return (
    <li className="flex items-center gap-3 rounded-2xl border-0 bg-card px-4 py-3 shadow-sm">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300">
        <FileText className="h-4 w-4" aria-hidden />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-[11px] text-muted-foreground">
          {item.meta}
          {item.status !== "uploaded" && (
            <span className="ml-2 rounded-full bg-secondary px-1.5 py-0.5 text-[9.5px]">
              {item.status}
            </span>
          )}
        </p>
        {error && (
          <p role="alert" className="mt-0.5 text-[10.5px] text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={remove}
        disabled={pending}
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
