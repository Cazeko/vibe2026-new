"use client";

// M1 헌법 v3.5.1 — Next.js 15 error boundary. 헌법 제37조 장애 시 사용자 보고.

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PodcastDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[podcast/id] page error", { digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-screen pb-12">
      <div className="px-6 mx-auto max-w-3xl pt-10 space-y-4">
        <Link
          href="/podcast"
          className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          팟캐스트 목록으로
        </Link>
        <div className="rounded-lg border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="h-5 w-5 text-warning shrink-0 mt-0.5"
              aria-hidden
            />
            <div className="min-w-0">
              <h1 className="font-serif text-lg font-medium tracking-tight">
                에피소드를 불러오지 못했습니다
              </h1>
              <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed break-keep">
                오디오 또는 스크립트 로드 중 오류가 발생했습니다.
                <br className="hidden md:inline" />{" "}
                다시 시도하거나 목록으로 이동해 주세요.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" onClick={() => reset()}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" aria-hidden />
                  다시 시도
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
