"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// 헌법 제37조 정합 — (main) 세그먼트 SSR 에러 boundary.
// `lib/db/queries.ts`의 safeRun은 query 단위 graceful degrade를 제공하지만,
// 그 바깥에서 throw하는 케이스(getDb 초기화·Supabase 인증·import 시점 에러)는
// 본 boundary가 받아 친절한 폴백 UI를 보장한다. console.error로 명시 보고.
export default function MainSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[main segment error]", error);
  }, [error]);

  return (
    <div className="min-h-screen px-6 py-12 mx-auto max-w-3xl">
      <Card className="border-warning/40 bg-warning/[0.06]">
        <CardContent className="p-8">
          <div className="flex items-start gap-3">
            <ShieldAlert
              className="h-6 w-6 text-warning shrink-0 mt-0.5"
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <p className="font-serif text-xl font-medium tracking-tight">
                일시적 오류가 발생했습니다
              </p>
              <p className="mt-2 text-[13px] text-foreground/85 leading-relaxed">
                서버 응답을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.
                문제가 계속되면 재로그인 후 시도해 주시거나, 설정에서 환경
                정보를 확인해 주세요.
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
                  <Link href="/dashboard">대시보드로</Link>
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
