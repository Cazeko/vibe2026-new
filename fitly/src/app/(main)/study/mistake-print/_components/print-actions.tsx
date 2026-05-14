"use client";

// 헌법 v3.5.1 제16조 — 오답노트 인쇄 액션. 브라우저 인쇄 다이얼로그 호출 후
// 사용자가 "PDF로 저장" 선택. 외부 의존성 0 (시행규칙 32 제34조 다듬기 정합).

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PrintActions() {
  return (
    <div className="no-print flex items-center justify-between gap-2 flex-wrap mb-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/study/mistake">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" aria-hidden />
          오답 트랙으로
        </Link>
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={() => window.print()}
        aria-label="브라우저 인쇄 다이얼로그 열기 — PDF로 저장 가능"
      >
        <Printer className="h-3.5 w-3.5 mr-1.5" aria-hidden />
        인쇄 · PDF 저장
      </Button>
    </div>
  );
}
