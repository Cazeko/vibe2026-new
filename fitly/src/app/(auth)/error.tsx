"use client";

// (auth) 그룹 error.tsx — 로그인/회원가입 흐름 SSR 에러 boundary.
// FitlySignIn 자체는 클라이언트 try/catch 로 setError 처리하지만, page wrapper
// 단의 metadata 직렬화 실패·import 시점 에러는 본 boundary 가 받는다.

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[auth segment error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 py-12 bg-background">
      <div className="flex flex-col items-center gap-3 max-w-md text-center">
        <AlertCircle
          className="h-8 w-8 text-destructive"
          aria-hidden
        />
        <h2 className="font-sans text-xl font-bold tracking-[-0.02em]">
          로그인 화면을 불러오지 못했습니다
        </h2>
        <p className="text-[13.5px] text-muted-foreground leading-[1.6]">
          일시적인 네트워크·서버 문제일 수 있습니다.
          <br />
          잠시 후 다시 시도해 주세요.
        </p>
        {error.digest && (
          <p className="text-[10.5px] text-muted-foreground tabular-nums font-mono">
            Digest: {error.digest}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <Button onClick={reset} size="sm">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden />
          다시 시도
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    </div>
  );
}
