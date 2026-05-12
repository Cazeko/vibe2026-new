"use client";

// admin 라우트 그룹 error.tsx — 운영자 도구 SSR 에러 boundary.
// 상위 (main)/error.tsx 와 분리해 운영자 페이지 전용 안내 문구를 노출한다.

import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin segment error]", error);
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
                운영자 도구 오류
              </p>
              <p className="mt-2 text-[13px] text-foreground/85 leading-relaxed">
                운영자 검토 큐를 불러오지 못했습니다. 권한·DB 연결을 확인 후
                다시 시도해 주세요. 문제가 지속되면 콘솔 로그·Digest 를 첨부해
                보고해 주세요.
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
                  <Link href="/admin/seed-review">검토 큐로</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">대시보드</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
