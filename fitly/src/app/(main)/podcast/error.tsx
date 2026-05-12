"use client";

// M1 헌법 v3.5.1 — Next.js 15 error boundary. 헌법 제37조 장애 시 사용자 보고.
// raw 에러 메시지 노출 금지 (헌법 제30조 보안 정합).

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PodcastError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[podcast] page error", { digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-screen pb-12">
      <div className="px-6 mx-auto max-w-3xl pt-10">
        <div className="rounded-lg border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="h-5 w-5 text-warning shrink-0 mt-0.5"
              aria-hidden
            />
            <div className="min-w-0">
              <h1 className="font-serif text-lg font-medium tracking-tight">
                팟캐스트를 불러오지 못했습니다
              </h1>
              <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed break-keep">
                일시적인 오류가 발생했습니다.
                <br className="hidden md:inline" />{" "}
                다시 시도하거나 잠시 후 재방문해 주세요.
              </p>
              <div className="mt-4">
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
