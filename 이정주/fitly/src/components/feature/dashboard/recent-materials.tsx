import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { RecentMaterial } from "@/lib/dashboard/types";

export function RecentMaterials({ items }: { items: RecentMaterial[] }) {
  return (
    <Card className="rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)] h-full">
      <CardContent className="p-4 h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">최근 학습 자료</h2>
          <Link
            href="/materials"
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            더보기 ›
          </Link>
        </div>

        {items.length === 0 ? (
          <Link
            href="/materials"
            className="mt-2 grid place-items-center rounded-xl border border-dashed border-border/60 bg-background/50 py-7 text-center text-[12px] text-muted-foreground hover:bg-secondary/30 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              첫 자료 업로드하기
            </span>
            <span className="mt-1 text-[10px]">PDF·이미지 → 자동 시카드 변환</span>
          </Link>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {items.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-background px-2.5 py-2"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300">
                  <FileText className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium truncate leading-tight">
                    {f.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {f.meta}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
