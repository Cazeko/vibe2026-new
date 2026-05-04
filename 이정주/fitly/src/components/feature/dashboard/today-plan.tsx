import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TODAY_PLAN } from "@/lib/data/demo-persona";

export function TodayPlan() {
  return (
    <Card className="rounded-2xl border-0 shadow-sm h-full">
      <CardContent className="p-5 h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">오늘의 학습 플랜</h2>
          <Link
            href="/study-plan"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            더보기 ›
          </Link>
        </div>

        <ul className="mt-4 space-y-3">
          {TODAY_PLAN.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-xl px-2 py-2"
            >
              <span
                className="mt-0.5 grid h-5 w-5 place-items-center rounded-md border border-border bg-background"
                aria-hidden
              >
                {item.state === "completed" && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
                {item.state === "locked" && (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={
                    item.state === "completed"
                      ? "text-sm font-medium text-muted-foreground line-through"
                      : "text-sm font-medium"
                  }
                >
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.subtitle}
                </p>
              </div>
              <ProgressBadge item={item} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ProgressBadge({
  item,
}: {
  item: (typeof TODAY_PLAN)[number];
}) {
  if (item.state === "locked") return null;
  if (item.state === "completed") {
    return (
      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary">
        <Check className="h-3.5 w-3.5" aria-hidden />
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 min-w-[2.75rem] items-center justify-center rounded-full bg-primary/10 px-2 text-[11px] font-semibold text-primary">
      {item.progress}%
    </span>
  );
}
