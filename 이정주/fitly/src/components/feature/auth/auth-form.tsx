"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "signup";

type AuthFormProps = {
  mode: Mode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    setMessage(null);

    const { error: err } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setStatus("idle");
    if (err) {
      setError(err.message);
      return;
    }

    if (mode === "signup") {
      setMessage(
        "확인 메일을 발송했습니다. 메일함에서 인증 후 로그인해 주세요."
      );
      return;
    }
    router.replace("/home");
    router.refresh();
  }

  async function handleKakao() {
    setStatus("loading");
    setError(null);
    // 헌법 제17조 5항 — Supabase OAuth (PKCE) 콜백을 통해 토큰 교환을 거친다.
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${origin}/auth/callback?next=/home`,
      },
    });
    if (err) {
      setStatus("idle");
      setError(err.message);
    }
  }

  const cta = mode === "login" ? "로그인" : "회원가입";
  const swap =
    mode === "login"
      ? { label: "아직 계정이 없으신가요?", href: "/signup", text: "회원가입" }
      : { label: "이미 가입하셨나요?", href: "/login", text: "로그인" };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6자 이상"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            처리 중…
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" aria-hidden />
            이메일로 {cta}
          </>
        )}
      </Button>

      <div className="relative py-1 text-center text-xs text-muted-foreground">
        <span className="relative z-10 bg-background px-2">또는</span>
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleKakao}
        disabled={status === "loading"}
      >
        카카오로 {cta}
      </Button>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}

      <p className="pt-2 text-center text-sm text-muted-foreground">
        {swap.label}{" "}
        <Link href={swap.href} className="font-medium text-foreground underline underline-offset-4 decoration-rule-strong hover:decoration-foreground">
          {swap.text}
        </Link>
      </p>
    </form>
  );
}
