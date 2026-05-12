"use client";

// 검증 완료 / 검증 해제 form 버튼 — useFormStatus 로 pending 상태를 노출한다.
// G1 fix: 버튼 로딩 피드백 부재 → useFormStatus 로 pending 시 spinner 표시.

import { useFormStatus } from "react-dom";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  variant?: "default" | "ghost";
  children: React.ReactNode;
};

export function VerifySubmitButton({ variant = "default", children }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden />
          처리 중…
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" aria-hidden />
          {children}
        </>
      )}
    </Button>
  );
}
