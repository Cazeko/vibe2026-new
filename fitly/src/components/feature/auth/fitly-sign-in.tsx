"use client";

// Fitly 로그인/회원가입 — 좌측 form + 우측 hero (가로 괘선 노트 + 펀치라인
// + 기능 강조 카드). 외부 라이브러리(three.js) X — 가벼운 CSS·tailwind로 구현.
//
// 디자인 정합:
// - DESIGN.md 토큰 (evergreen·rule·cream·serif·sans·tabular-nums)
// - 헌법 §4 펀치라인 그대로 노출
// - 헌법 §3.2 정직성 — 후기는 익명 가공 자료 X, *기능 강조*로 대체

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, BookOpen, Sparkles, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
};

const FEATURE_CARDS = [
  {
    Icon: BookOpen,
    title: "24년치 공식 기출",
    body: "2002~2026 KICE 공개 기출의 영역·인지수준·키워드 자동 추출.",
  },
  {
    Icon: BarChart3,
    title: "1차 합격선 추이",
    body: "시도교육청 발표 자료 기반 학년도별 합격선·경쟁률 시각화.",
  },
  {
    Icon: Sparkles,
    title: "AI 모범답안",
    body: "서술·논술 답안을 작성하고 AI 모범답안과 비교, 자가 채점.",
  },
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
      setMessage(
        "확인 메일을 발송했습니다. 메일함에서 인증 후 로그인해 주세요.",
      );
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  async function handleKakao() {
    setStatus("loading");
    setError(null);
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
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

  const heading = mode === "login" ? "다시 만나서 반갑습니다." : "학습 여정을 시작합니다.";
  const sub =
    mode === "login"
      ? "오늘의 학습으로 돌아오신 것을 환영합니다."
      : "이메일 한 줄로 24년치 공식 기출에 접근하세요. 무료입니다.";
  const cta = mode === "login" ? "로그인" : "회원가입";
  const swap =
    mode === "login"
      ? { label: "아직 계정이 없으신가요?", href: "/signup", text: "회원가입" }
      : { label: "이미 가입하셨나요?", href: "/login", text: "로그인" };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      {/* 좌측 form */}
      <section className="flex-1 flex items-center justify-center px-6 py-10 md:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            {/* F 로고 + 헤딩 */}
            <div className="flex items-center gap-3 animate-element animate-delay-100">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-evergreen text-primary-foreground font-serif italic font-medium text-lg">
                F
              </span>
              <span className="font-serif text-xl tracking-tight">
                Fitly<span className="text-evergreen">.</span>
              </span>
            </div>

            {/* 모바일 전용 펀치라인 — md+ 는 우측 hero에서 큰 사이즈로 노출.
                D006 정합 — 모바일 사용자 첫 가치 제안 누락 보강. */}
            <p className="md:hidden animate-element animate-delay-150 font-serif text-[15px] leading-[1.5] text-foreground/85">
              임용은 열심히 하는 게 아니라,{" "}
              <em className="font-serif italic font-semibold text-foreground">
                맞게(Fit)
              </em>{" "}
              하는 게임입니다.
            </p>

            <h1 className="animate-element animate-delay-200 font-serif text-3xl md:text-4xl font-medium leading-[1.2] tracking-tight">
              {heading}
            </h1>
            <p className="animate-element animate-delay-300 text-[13.5px] text-muted-foreground leading-relaxed">
              {sub}
            </p>

            <form className="space-y-4 animate-element animate-delay-400" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground"
                >
                  이메일
                </label>
                <GlassInputWrapper>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-[14px] px-4 py-3.5 rounded-lg focus:outline-none placeholder:text-muted-foreground/60"
                  />
                </GlassInputWrapper>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground"
                >
                  비밀번호
                </label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="6자 이상"
                      className="w-full bg-transparent text-[14px] px-4 py-3.5 pr-12 rounded-lg focus:outline-none placeholder:text-muted-foreground/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4.5 h-4.5" aria-hidden />
                      ) : (
                        <Eye className="w-4.5 h-4.5" aria-hidden />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-lg bg-evergreen py-3.5 font-medium text-primary-foreground hover:bg-evergreen-strong transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 text-[14px]"
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
              </button>
            </form>

            <div className="animate-element animate-delay-500 relative flex items-center justify-center text-[12px] text-muted-foreground py-1">
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-rule" />
              <span className="relative z-10 bg-background px-3">또는</span>
            </div>

            <button
              type="button"
              onClick={handleKakao}
              disabled={status === "loading"}
              className="animate-element animate-delay-600 w-full rounded-lg border border-rule-strong py-3.5 hover:bg-secondary/50 transition-colors disabled:opacity-60 text-[14px] font-medium"
            >
              카카오로 {cta}
            </button>

            {error && (
              <p role="alert" className="text-[13px] text-destructive">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="text-[13px] text-muted-foreground">
                {message}
              </p>
            )}

            <p className="animate-element animate-delay-700 text-center text-[13px] text-muted-foreground">
              {swap.label}{" "}
              <Link
                href={swap.href}
                className="font-medium text-foreground underline underline-offset-2 hover:text-evergreen"
              >
                {swap.text}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* 우측 hero — 가로 괘선 노트 + 펀치라인 + 기능 강조 카드 */}
      <aside
        className="hidden md:flex flex-1 relative bg-secondary/30 overflow-hidden"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0, transparent 35px, hsl(var(--color-rule)) 35px, hsl(var(--color-rule)) 36px)",
        }}
        aria-hidden
      >
        <div className="relative z-10 flex flex-col justify-between w-full p-10 lg:p-14">
          {/* 상단: 펀치라인 */}
          <div className="animate-slide-right animate-delay-300 max-w-xl pt-10 lg:pt-20">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-5">
              Fitly · 초등 임용 1차 학습 플래너
            </p>
            <p className="font-serif text-3xl lg:text-4xl leading-[1.35] tracking-tight text-foreground/95">
              임용은 열심히 하는 게 아니라,
              <br />
              <em className="font-serif italic font-semibold text-foreground">
                맞게(Fit)
              </em>{" "}
              하는 게임입니다.
            </p>
          </div>

          {/* 하단: 기능 강조 카드 3장 — 카드 제목은 sans Small (§3 스케일) */}
          <ul className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 mt-10">
            {FEATURE_CARDS.map((card, idx) => (
              <li
                key={card.title}
                className={`animate-testimonial animate-delay-${
                  1000 + idx * 200
                } rounded-lg bg-card border border-rule p-4 lg:p-5`}
              >
                <card.Icon
                  className="h-4 w-4 text-muted-foreground mb-2"
                  aria-hidden
                />
                <p className="font-sans text-sm font-semibold tracking-tight text-foreground">
                  {card.title}
                </p>
                <p className="mt-1 text-[11.5px] text-muted-foreground leading-relaxed">
                  {card.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function GlassInputWrapper({ children }: { children: React.ReactNode }) {
  // DESIGN.md §8.3 — 보더 1px rule-strong, 배경 cream(=bg), focus 시 보더 evergreen +
  // 3px accent-soft 박스 섀도 (D005 정합).
  return (
    <div className="mt-1.5 rounded-lg border border-rule-strong bg-background transition-[box-shadow,border-color] focus-within:border-evergreen focus-within:shadow-[0_0_0_3px_hsl(var(--color-accent)/0.18)]">
      {children}
    </div>
  );
}
