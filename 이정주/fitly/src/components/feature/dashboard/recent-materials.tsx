import Link from "next/link";
import { FileText, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RECENT_FILES } from "@/lib/data/demo-persona";

export function RecentMaterials() {
  return (
    <Card className="rounded-2xl border-0 shadow-sm h-full">
      <CardContent className="p-5 h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">최근 학습 자료</h2>
          <Link
            href="/materials"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            더보기 ›
          </Link>
        </div>

        <ul className="mt-4 space-y-3">
          {RECENT_FILES.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-2.5"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-500">
                <FileText className="h-4 w-4" aria-hidden />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-[11px] text-muted-foreground">{f.meta}</p>
              </div>
              <button
                type="button"
                aria-label="더보기"
                className="text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
