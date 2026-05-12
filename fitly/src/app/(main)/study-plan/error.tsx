"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// M1 (헌법 제24조의2·제37조 정합) — 학습 계획 에러 boundary.
export default function StudyPlanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[study-plan error]", error);
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
                학습 계획을 불러오지 못했습니다
              </p>
              <p className="mt-2 text-[13px] text-foreground/85 leading-relaxed">
                시험일 역산 계산 중 일시적 오류가 발생했습니다.
                <br className="hidden sm:inline" />
                잠시 후 다시 시도해 주세요.
              </p>
              {error.digest && (
                <p className="mt-3 text-[10.5px] text-muted-foreground tabular-nums">
                  Digest: <span className="font-mono">{error.digest}</span>
                </p>
              )}
              <div className="mt-5 flex items-center gap-2 flex-wrap">
                <Button onClick={reset} size="sm">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                  다시 시도
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">대시보드로</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/settings">설정</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
