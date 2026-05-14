"use client";

// 헌법 시행규칙 33 §35 — 운영자 신고 처리 form 버튼 (PR-7, 2026-05-15).
// pending → reviewed / dismissed 토글. useFormStatus 로 pending 피드백 노출.

import { useFormStatus } from "react-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type Tone = "reviewed" | "dismissed";

type Props = {
  tone: Tone;
  children: React.ReactNode;
};

export function ReportSubmitButton({ tone, children }: Props) {
  const { pending } = useFormStatus();
  const Icon = tone === "reviewed" ? CheckCircle2 : XCircle;
  const className =
    tone === "reviewed"
      ? "inline-flex h-8 items-center gap-1.5 rounded-md bg-evergreen px-3 text-[12px] font-semibold text-primary-foreground hover:bg-evergreen-strong disabled:opacity-60"
      : "inline-flex h-8 items-center gap-1.5 rounded-md border border-rule bg-card px-3 text-[12px] font-medium text-muted-foreground hover:bg-secondary/60 disabled:opacity-60";
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        <Icon className="h-3.5 w-3.5" aria-hidden />
      )}
      {children}
    </button>
  );
}
