"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// 헌법 v3.0 §13의3 — 사용자 즉석 청취 (본인 약점 영역·자료 기반).
// API: POST /api/podcast/generate { theme, scope:'user' }

type Status = "idle" | "loading" | "error";

export function InstantGenerate() {
  const router = useRouter();
  const [theme, setTheme] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const t = theme.trim();
    if (t.length < 4) {
      setError("주제를 4자 이상 입력해 주세요");
      return;
    }
    setStatus("loading");
    setError(null);
    // HIGH-002 — Vercel maxDuration=60 안에서 끝나도록 클라이언트도 55s 한도
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55_000);
    try {
      const res = await fetch("/api/podcast/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: t, scope: "user" }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 504) {
          throw new Error("생성 시간 초과 — 더 짧은 주제로 다시 시도해 주세요");
        }
        throw new Error(data.error ?? "생성 실패");
      }
      router.push(`/podcast/${data.episodeId}`);
      router.refresh();
    } catch (e) {
      setStatus("error");
      if (e instanceof Error && e.name === "AbortError") {
        setError("생성이 1분을 초과했습니다 — 다시 시도해 주세요");
      } else {
        setError(e instanceof Error ? e.message : "생성 실패");
      }
    } finally {
      clearTimeout(timer);
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0"
      >
        <Sparkles className="h-3.5 w-3.5 mr-1.5" aria-hidden />
        즉석 생성
      </Button>
    );
  }

  return (
    <div className="w-full mt-3 space-y-3">
      <label htmlFor="theme" className="block text-[12px] uppercase tracking-[0.12em] text-muted-foreground">
        주제 또는 영역
      </label>
      <input
        id="theme"
        type="text"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        placeholder="예: 2024 교직논술 1번 — 학습자 중심 교육"
        maxLength={200}
        disabled={status === "loading"}
        className="w-full rounded-lg border border-rule-strong bg-background px-3 py-2.5 text-[13px] focus:outline-none focus:border-evergreen focus:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.18)] transition-[box-shadow,border-color]"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <Button type="button" onClick={submit} disabled={status === "loading"}>
          {status === "loading" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden />
              생성 중…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" aria-hidden />
              생성 시작
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={status === "loading"}
        >
          취소
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-[12px] text-destructive">
          {error}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        본 에피소드는 본인만 청취할 수 있으며, AI 생성으로 공식 해설이 아닙니다.
        2~3분 분량으로 생성에 30~50초 소요됩니다.
      </p>
    </div>
  );
}
