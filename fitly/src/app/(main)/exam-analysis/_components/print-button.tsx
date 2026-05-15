"use client";

import { Printer } from "lucide-react";

// 주인님 발화 (2026-05-15) — 종전 server component 안 <a href="javascript:..."/>
// 가 React/Next.js 보안(XSS 회피) 정책으로 무시되어 클릭 시 동작 없는 회귀.
// client island 로 분리해 onClick 으로 window.print() 직접 호출.
//
// 동작: 현재 기출분석 페이지 전체를 브라우저 인쇄 다이얼로그로 띄움.
// CSS @media print 정합으로 사이드바·헤더 등 화면용 UI 는 숨기고 분석 본문만 출력.
// 사용자는 인쇄 또는 "PDF 로 저장" 옵션 선택 가능.

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-rule-strong px-3 text-[12.5px] font-semibold text-muted2-deep hover:border-evergreen hover:text-evergreen transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 cursor-pointer"
      aria-label="현재 분석 페이지를 PDF/지면 출력"
    >
      <Printer className="h-3.5 w-3.5" aria-hidden />
      <span className="hidden sm:inline">PDF 저장 / 인쇄</span>
      <span className="sm:hidden">PDF</span>
    </button>
  );
}
