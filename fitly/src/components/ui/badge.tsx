import * as React from "react";
import { cn } from "@/lib/utils";

// v3.7 외부 평가 #4.11 — 배지 컴포넌트 통일.
// 종전 분산된 `inline-flex items-center gap-1 rounded-full bg-X/10 px-1.5 py-0.5
// text-[10px]` 패턴을 단일 컴포넌트로 흡수. tone·size 만 props 로.
// §4.3 evergreen 6 사용처 보호 — evergreen tone 은 *검증 완료·active 메뉴* 등
// 인정 위치에만 사용.

type Tone = "info" | "warning" | "evergreen" | "muted" | "error" | "gold";
type Size = "sm" | "md";

const TONE_CLASS: Record<Tone, string> = {
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning-text",
  evergreen: "bg-evergreen/10 text-evergreen",
  muted: "bg-muted/30 text-muted-foreground/80",
  error: "bg-error/10 text-error",
  gold: "bg-gold-soft/60 text-foreground",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-[10.5px]",
};

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  size?: Size;
};

export function Badge({
  tone = "muted",
  size = "sm",
  className,
  children,
  ...props
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium leading-none whitespace-nowrap",
        SIZE_CLASS[size],
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
