"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Counts = {
  vocab: number;
  mistakes: number;
};

export function TodayActions() {
  const [counts, setCounts] = useState<Counts>({ vocab: 0, mistakes: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/vocab/next").then((r) => r.json()).catch(() => ({ items: [] })),
      fetch("/api/mistakes/next").then((r) => r.json()).catch(() => ({ items: [] })),
    ]).then(([v, m]) => {
      setCounts({
        vocab: Array.isArray(v.items) ? v.items.length : 0,
        mistakes: Array.isArray(m.items) ? m.items.length : 0,
      });
    });
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        오늘의 액션
      </p>
      <div className="grid grid-cols-2 gap-2">
        <ActionTile
          href="/study/vocab"
          Icon={BookOpen}
          label="영단어"
          count={counts.vocab}
        />
        <ActionTile
          href="/study/review"
          Icon={RefreshCw}
          label="시카드"
          count={counts.mistakes}
        />
      </div>
    </div>
  );
}

function ActionTile({
  href,
  Icon,
  label,
  count,
}: {
  href: string;
  Icon: typeof BookOpen;
  label: string;
  count: number;
}) {
  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:bg-secondary/60">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold num">
                {count}
                <span className="text-xs font-normal text-muted-foreground">
                  {" "}
                  / due
                </span>
              </p>
            </div>
          </div>
          <ArrowRight
            className="h-4 w-4 text-muted-foreground"
            aria-hidden
          />
        </CardContent>
      </Card>
    </Link>
  );
}
