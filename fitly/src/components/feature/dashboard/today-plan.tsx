import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import type { PlanItem } from "@/lib/dashboard/types";

const STATE_ICON = {
  in_progress: Circle,
  completed: CheckCircle2,
  locked: Lock,
} as const;

// 헌법 v2.1 — completed 만 evergreen (액센트 5번 — 진척 마커), in_progress 는 회색.
const STATE_TONE: Record<PlanItem["state"], string> = {
  in_progress: "text-muted-foreground",
  completed: "text-evergreen",
  locked: "text-muted-foreground/40",
};

// 헌법 v1.10 — TodayPlan 은 실데이터(SRS 듀카드 + 오늘 푼 문제 수)로 산출된다.
export function TodayPlan({ items }: { items: PlanItem[] }) {
  return (
    <Card className="border-rule h-full">
      <CardContent className="p-5 h-full">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-medium tracking-tight">
            오늘의 학습 플랜
          </h2>
          <Link
            href="/study-plan"
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            전체 ›
          </Link>
        </div>

        <ul className="mt-2 space-y-1.5">
          {items.map((item) => {
            const Icon = STATE_ICON[item.state];
            const tone = STATE_TONE[item.state];
            const isLocked = item.state === "locked";
            return (
              <li key={item.id}>
                <Link
                  href={isLocked ? "#" : item.href}
                  aria-disabled={isLocked}
                  className={`flex items-center gap-2.5 rounded-lg border border-rule bg-background px-2.5 py-2 transition-colors ${
                    isLocked
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-secondary/40"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${tone}`} aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium leading-tight truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                  {!isLocked && (
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {item.progress}%
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
