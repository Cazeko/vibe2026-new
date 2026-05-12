"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// M1 (헌법 제24조의2·제37조 정합) — 대시보드 에러 boundary.
// (main)/error.tsx의 보다 좁은 범위 fallback. dashboard 페이지에서 throw 시 본 boundary가 우선 캐치.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard error]", error);
  }, [error]);

  return (
    <div className="min-h-screen px-6 py-12 mx-auto max-w-3xl">
      <Card className="border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30">
        <CardContent className="p-8">
          <div className="flex items-start gap-3">
            <ShieldAlert
              className="h-6 w-6 text-warning shrink-0 mt-0.5"
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <p className="font-serif text-xl font-medium tracking-tight">
                대시보드를 불러오지 못했습니다
              </p>
              <p className="mt-2 text-[13px] text-foreground/85 leading-relaxed">
                학습 기록 집계 중 일시적 오류가 발생했습니다.
                <br className="hidden sm:inline" />
                잠시 후 다시 시도해 주세요. 문제가 계속되면 재로그인 후 시도해 주세요.
              </p>
              {error.digest && (
                <p className="mt-3 text-[10.5px] text-muted-foreground tabular-nums">
                  Digest:{" "}
                  <span className="font-mono">{error.digest}</span>
                </p>
              )}
              <div className="mt-5 flex items-center gap-2 flex-wrap">
                <Button onClick={reset} size="sm">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                  다시 시도
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/settings">설정</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">재로그인</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
