"use client";

// Fitly 로그인/회원가입 — 신규 디자인 Intro 정합 (2026-05-12)
// 좌: evergreen hero (브랜드 + OUR THESIS + 적합도 헤드라인 + 3 stats)
// 우: cream 로그인 폼 (LOG IN eyebrow + 큰 제목 + 이메일/비밀번호 + 카카오)

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FitlyLogo } from "@/components/shared/fitly-logo";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
};

const STATS = [
  { num: "24", label: "년치 공식 기출" },
  { num: "17", label: "개 시도교육청" },
  { num: "1차", label: "초등 임용시험" },
];

export function FitlySignIn({ mode }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setMessage("확인 메일을 발송했습니다. 메일함에서 인증 후 로그인해 주세요.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  async function handleKakao() {
    setStatus("loading");
    setError(null);
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${origin}/auth/callback?next=/dashboard`,
      },
    });
    if (err) {
      setStatus("idle");
      setError(err.message);
    }
  }

  const titleTop = mode === "login" ? "오늘의 한 걸음을" : "학습 여정을";
  const titleBottom = mode === "login" ? "시작합니다." : "시작합니다.";
  const sub =
    mode === "login"
      ? "로그인하고 학습 플래너로 들어가세요."
      : "이메일 한 줄로 24년치 공식 기출에 접근하세요. 무료입니다.";
  const cta = mode === "login" ? "로그인" : "회원가입";
  const swap =
    mode === "login"
      ? { label: "아직 계정이 없으신가요?", href: "/signup", text: "회원가입" }
      : { label: "이미 가입하셨나요?", href: "/login", text: "로그인" };

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-[1.05fr_1fr]">
      {/* ─ HERO 좌측 (evergreen + 종이그레인은 globals.css body 그대로 비침) ─ */}
      <section
        className="relative overflow-hidden bg-evergreen text-cream flex flex-col justify-between px-7 md:px-10 lg:px-[72px] py-10 md:py-16 gap-12 md:gap-24"
        aria-label="Fitly 소개"
      >
        {/* 점선 모눈 데코 7% (신규 디자인 hero::before) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--color-bg)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--color-bg)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* 상단: 브랜드 + 시즌 */}
        <header className="relative flex items-center gap-3 animate-element animate-delay-100">
          <FitlyLogo size="md" onAccentBg />
          <span className="ml-auto hidden lg:inline-block text-[11.5px] font-semibold tracking-[0.18em] text-gold">
            2026 · 초등 임용 1차
          </span>
        </header>

        {/* 중단: OUR THESIS + 헤드라인 + 설명 */}
        <div className="relative animate-element animate-delay-200 max-w-[460px]">
          <p className="text-[12px] font-bold tracking-[0.2em] text-gold mb-[18px]">
            OUR THESIS
          </p>
          <h1 className="font-sans font-bold leading-[1.18] tracking-[-0.025em] text-[clamp(34px,5.2vw,56px)] text-cream">
            임용은 열심히 하는 게
            <br />
            아니라, <em className="not-italic text-gold">맞게(Fit)</em> 하는 게임입니다.
          </h1>
          <p className="mt-[22px] text-[clamp(14px,1.05vw,15.5px)] leading-[1.7] text-cream/80">
            기출 24년 · 합격선 17개 시도교육청 공식 자료로,
            <br />
            지금 당신에게 부족한 한 점을 찾아드립니다.
          </p>
        </div>

        {/* 하단: 3 stats with vertical dividers */}
        <div
          className="relative grid grid-cols-3 border-t border-cream/15 pt-[26px] animate-element animate-delay-300"
          role="list"
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              role="listitem"
              className={i > 0 ? "border-l border-cream/15 pl-6" : ""}
            >
              <p className="font-serif text-[clamp(28px,3.4vw,38px)] font-semibold leading-[1.1] text-cream num">
                {s.num}
              </p>
              <p className="mt-1 text-[11.5px] tracking-[0.08em] text-cream/60">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─ LOGIN 우측 (cream) ─ */}
      <section className="bg-background flex flex-col justify-center items-center px-7 md:px-10 lg:px-12 py-14 md:py-24">
        <div className="w-full max-w-[420px]">
          <p className="text-[11px] font-bold tracking-[0.22em] text-muted-foreground animate-element animate-delay-100">
            {mode === "login" ? "LOG IN" : "SIGN UP"}
          </p>
          <h2 className="mt-3 mb-2 font-sans font-bold leading-[1.2] tracking-[-0.02em] text-[clamp(26px,3.2vw,36px)] animate-element animate-delay-200">
            {titleTop}
            <br />
            {titleBottom}
          </h2>
          <p className="mt-1 text-[14.5px] text-muted-foreground animate-element animate-delay-300">
            {sub}
          </p>

          <form
            className="mt-9 grid gap-3.5 animate-element animate-delay-400"
            onSubmit={handleSubmit}
          >
            <label className="grid">
              <span className="text-[12.5px] font-semibold text-muted2-deep mb-2">
                이메일
              </span>
              <span className="flex h-[52px] items-center rounded-lg border border-transparent bg-cream-deep px-4 text-[14px] focus-within:border-evergreen focus-within:bg-cream-soft transition-all">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-muted-foreground/60"
                />
              </span>
            </label>

            <label className="grid">
              <span className="text-[12.5px] font-semibold text-muted2-deep mb-2">
                비밀번호
              </span>
              <span className="relative flex h-[52px] items-center rounded-lg border border-transparent bg-cream-deep px-4 text-[14px] focus-within:border-evergreen focus-within:bg-cream-soft transition-all">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none pr-10 placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                  className="absolute right-3 inline-flex items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" aria-hidden />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" aria-hidden />
                  )}
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-1.5 inline-flex h-[52px] items-center justify-center gap-2.5 rounded-md bg-evergreen px-4 text-[15px] font-semibold text-white hover:bg-evergreen-strong active:translate-y-px transition-all disabled:opacity-60"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  처리 중…
                </>
              ) : (
                <>
                  이메일로 {cta}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleKakao}
              disabled={status === "loading"}
              className="inline-flex h-[52px] items-center justify-center rounded-md border border-rule-strong bg-transparent text-[14.5px] font-semibold text-foreground hover:bg-cream-soft hover:border-rule-strong/80 transition-colors disabled:opacity-60"
            >
              카카오로 계속하기
            </button>
          </form>

          {/* ─ 시즌 안내 카드 ─ */}
          <aside className="mt-9 flex items-center gap-3.5 rounded-lg border border-rule bg-cream-soft px-[18px] py-4 animate-element animate-delay-500">
            <Sparkles className="h-[18px] w-[18px] shrink-0 text-evergreen" aria-hidden />
            <p className="text-[12.5px] leading-[1.55] text-muted2-deep">
              <strong className="font-bold text-foreground">2026학년도 시즌 오픈</strong>
              {" · "}6월 모의 · 7월 핵심 단권화 · 9월 실전
            </p>
          </aside>

          {error && (
            <p role="alert" className="mt-4 text-[13px] text-destructive">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="mt-4 text-[13px] text-muted-foreground">
              {message}
            </p>
          )}

          <p className="mt-7 text-center text-[13px] text-muted-foreground animate-element animate-delay-600">
            {swap.label}{" "}
            <Link
              href={swap.href}
              className="font-bold text-evergreen border-b border-evergreen hover:text-evergreen-strong hover:border-evergreen-strong"
            >
              {swap.text}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
