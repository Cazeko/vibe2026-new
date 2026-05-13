"use client";

// Fitly 로그인/회원가입 — 신규 디자인 Intro 정합 (2026-05-12, 헌법 v3.5.1)
// 모바일: hero(소개) 상단 → login 하단
// 데스크톱: login 좌측 → hero 우측 (md:order-1/2 로 시각 순서 스왑, DOM 순서는 유지)
// 펀치라인은 헌법 제4조 v3.5.1 개정본 사용 + 한글 줄바꿈은 제4조의3 정합.
// 2026-05-12 추가 다듬기 (헌법 v3.5.1 정합) — placeholder 75% / focus transition
// 150ms / kakao hover secondary 정합 / error·message 시각 구분 + 아이콘 / 클라
// 이언트 이메일·비번 검증 / aria-live polite / signup hint·\n 줄바꿈.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FitlyLogo } from "@/components/shared/fitly-logo";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
};

const STATS = [
  { num: "24", label: "년치 공식 기출" },
  { num: "17", label: "개 시도교육청" },
  { num: "12,840", label: "명 누적 응시자" },
];

// 헌법 제4조의3 — 한글 줄바꿈 일관. 이메일 형식 RFC 5322 단순화 정규식.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateInputs(
  email: string,
  password: string
): { ok: true } | { ok: false; reason: string } {
  if (!EMAIL_RE.test(email)) {
    return { ok: false, reason: "이메일 형식이 올바르지 않습니다." };
  }
  if (password.length < 6) {
    return { ok: false, reason: "비밀번호는 6자 이상이어야 합니다." };
  }
  return { ok: true };
}

// 종이그레인 — globals.css body 와 동일한 1% 노이즈 (로그인 섹션이 body bg 를
// 덮으므로 동일 패턴을 명시 적용한다)
const PAPER_GRAIN_STYLE: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, hsl(var(--color-text) / 0.018) 1px, transparent 0)",
  backgroundSize: "4px 4px",
};

// 카카오 브랜드 가이드 정합 (developers.kakao.com/docs/latest/ko/kakaologin/design-guide).
// 배경 #FEE500, 텍스트 rgba(0,0,0,0.85), 검은 말풍선 심볼. 외부 평가 P0-02
// (2026-05-12) — 일반 outlined 버튼은 카카오 인지성 부족.
function KakaoSymbol({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      width="18"
      height="18"
      aria-hidden="true"
      className={className}
    >
      <path
        fill="currentColor"
        d="M9 1C4.58 1 1 3.86 1 7.39c0 2.27 1.49 4.27 3.74 5.41-.17.62-.6 2.2-.69 2.55-.11.43.16.43.34.31.14-.09 2.2-1.5 3.09-2.1.5.07 1 .1 1.52.1 4.42 0 8-2.86 8-6.39S13.42 1 9 1z"
      />
    </svg>
  );
}

// C-2 (외부 리뷰 2026-05-12) — "로그인 상태 유지" UI 체크박스 (login 모드 한정).
// Supabase 는 기본적으로 localStorage session persistence 사용 → 체크박스는 사용자에게
// 명시적 안내 + 이메일 prefill (localStorage) 시그널. 미체크 시 이메일도 비우는 정책.
const REMEMBER_KEY = "fitly:remember-email";

export function FitlySignIn({ mode }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // C-2 — mount 시 localStorage 에서 이메일 prefill (로그인 모드 한정).
  useEffect(() => {
    if (mode !== "login") return;
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // T1 — 클라이언트 이메일·비밀번호 검증 (서버 검증 보완)
    const v = validateInputs(email, password);
    if (!v.ok) {
      setError(v.reason);
      return;
    }

    setStatus("loading");
    const { error: err } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setStatus("idle");
    if (err) {
      setError(err.message);
      return;
    }

    // C-2 — login 성공 시 remember 정책 적용. 미체크 시 prefill 삭제.
    if (mode === "login" && typeof window !== "undefined") {
      if (remember) {
        window.localStorage.setItem(REMEMBER_KEY, email);
      } else {
        window.localStorage.removeItem(REMEMBER_KEY);
      }
    }

    if (mode === "signup") {
      // B1 — 명시 줄바꿈으로 의미 단위 절단 방지 (제4조의3)
      setMessage("확인 메일을 발송했습니다.\n메일함에서 인증 후 로그인해 주세요.");
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

  // P0-05 (2026-05-12 외부 평가) — 이메일·비번 양쪽 유효성 통과해야만
  // submit 활성. 카카오는 input 의존성 없으므로 별도 비활성 조건 없음.
  const isFormValid = EMAIL_RE.test(email) && password.length >= 6;
  const isLoading = status === "loading";

  const titleTop = mode === "login" ? "오늘의 한 걸음을" : "학습 여정을";
  const titleBottom = "시작합니다.";
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
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* ─ HERO (소개) — 데스크톱 우측, 모바일 숨김 ─
          v3.6 외부 평가 #1.1 — 다크 hero 채도/광도 down (bg-hero-bg).
          v3.6 외부 평가 #1.12 — 모바일에서 hero 패널 hidden 처리하여
          로그인 폼에 집중. 데스크톱(md+)에서만 hero 노출. */}
      <section
        className="relative overflow-hidden bg-hero-bg text-cream hidden md:flex flex-col justify-between px-7 md:px-10 lg:px-[72px] py-10 md:py-16 gap-12 md:gap-24 md:order-2"
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

        {/* 상단: 브랜드 + 시즌. v3.6 외부 평가 #1.14 — 로고 좌측 padding 보강. */}
        <header className="relative flex items-center gap-3 pl-1 animate-element animate-delay-100">
          <FitlyLogo size="lg" onAccentBg />
          <span className="ml-auto hidden lg:inline-block text-[11.5px] font-semibold tracking-[0.18em] text-gold">
            2026 · 초등 임용 1차
          </span>
        </header>

        {/* 중단: OUR THESIS + 헤드라인 + 설명 (제4조 v3.5.1 펀치라인) */}
        <div className="relative animate-element animate-delay-200 max-w-[460px]">
          <p className="text-[12px] font-bold tracking-[0.2em] text-gold mb-[18px]">
            OUR THESIS
          </p>
          {/* v3.6 외부 평가 #1.7 — H1 line-height 1.18 → 1.32 (가독성). */}
          <h1 className="font-sans font-bold leading-[1.32] tracking-[-0.025em] text-[clamp(34px,5.2vw,56px)] text-cream">
            합격은 시간이
            <br />
            아니라 <em className="not-italic text-gold">적합도</em>다.
          </h1>
          <p className="mt-[22px] text-[clamp(14px,1.05vw,15.5px)] leading-[1.7] text-cream/80">
            기출 24년 · 합격선 17개 시도 · 누적 응시자 12,840명의 데이터로,
            <br />
            지금 당신에게 부족한 한 점을 찾아드립니다.
          </p>
        </div>

        {/* 하단: 3 stats — 구분선 제거 (헌법 v3.5.1 사용자 요청) */}
        <div
          className="relative grid grid-cols-3 pt-[26px] animate-element animate-delay-300"
          role="list"
        >
          {STATS.map((s) => (
            <div key={s.label} role="listitem">
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

      {/* ─ LOGIN — 데스크톱 좌측 / 모바일 하단 (cream + paper grain) ─ */}
      <section
        className="bg-background flex flex-col justify-center items-center px-7 md:px-10 lg:px-12 py-14 md:py-24 md:order-1"
        style={PAPER_GRAIN_STYLE}
      >
        <div className="w-full max-w-[420px]">
          <p className="text-[11px] font-bold tracking-[0.22em] text-muted-foreground animate-element animate-delay-100">
            {mode === "login" ? "LOG IN" : "SIGN UP"}
          </p>
          {/* v3.6 외부 평가 #1.7 — H2 line-height 1.20 → 1.35. */}
          <h2 className="mt-3 mb-2 font-sans font-bold leading-[1.35] tracking-[-0.02em] text-[clamp(26px,3.2vw,36px)] animate-element animate-delay-200">
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
              {/* v3.6 외부 평가 #1.5·1.6·1.10 — Focus ring evergreen 2px / 다크 보더
                  명시 / 에러 시 빨간 보더 + aria-invalid. */}
              <span
                className={`flex h-[52px] items-center rounded-lg border bg-cream-deep dark:bg-cream-deep dark:border-rule-strong px-4 text-[14px] focus-within:border-evergreen focus-within:bg-cream-soft focus-within:ring-2 focus-within:ring-evergreen/40 focus-within:ring-offset-0 transition-all duration-150 ${
                  error && !EMAIL_RE.test(email)
                    ? "border-destructive ring-1 ring-destructive/40"
                    : "border-transparent"
                }`}
              >
                <input
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  aria-label="이메일 주소 입력"
                  aria-invalid={error && !EMAIL_RE.test(email) ? "true" : "false"}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none focus:outline-none focus-visible:outline-none focus-visible:shadow-none placeholder:text-muted-foreground/75"
                />
              </span>
            </label>

            <label className="grid">
              <span className="flex items-baseline justify-between mb-2">
                <span className="text-[12.5px] font-semibold text-muted2-deep">
                  비밀번호
                </span>
                {mode === "signup" && (
                  <span className="text-[11px] text-muted-foreground">
                    6자 이상
                  </span>
                )}
              </span>
              {/* v3.6 외부 평가 #1.5·1.6·1.10 — Focus ring 2px / 다크 보더 / 에러 빨간. */}
              <span
                className={`relative flex h-[52px] items-center rounded-lg border bg-cream-deep dark:bg-cream-deep dark:border-rule-strong px-4 text-[14px] focus-within:border-evergreen focus-within:bg-cream-soft focus-within:ring-2 focus-within:ring-evergreen/40 focus-within:ring-offset-0 transition-all duration-150 ${
                  error && password.length > 0 && password.length < 6
                    ? "border-destructive ring-1 ring-destructive/40"
                    : "border-transparent"
                }`}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  aria-label="비밀번호 입력"
                  aria-invalid={
                    error && password.length > 0 && password.length < 6
                      ? "true"
                      : "false"
                  }
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none focus:outline-none focus-visible:outline-none focus-visible:shadow-none pr-12 placeholder:text-muted-foreground/75"
                />
                {/* P0-04 (외부 평가) — WCAG 2.5.5 정합 — hitbox 44×44 보장.
                    터치 영역만 확대하고 아이콘 자체는 18px 유지. */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                  aria-pressed={showPassword}
                  className="absolute right-1 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" aria-hidden />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" aria-hidden />
                  )}
                </button>
              </span>
            </label>

            {/* C-2 (외부 리뷰 2026-05-12) — login 모드 한정 "로그인 상태 유지" 체크박스.
                v3.6 외부 평가 #1.4 — accent-evergreen 으로 네이티브 파란색 → 브랜드 그린. */}
            {mode === "login" && (
              <label className="-mt-0.5 mb-0.5 flex items-center gap-2 text-[12.5px] text-muted2-deep cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ accentColor: "hsl(var(--color-accent))" }}
                  className="h-4 w-4 rounded border border-rule-strong accent-evergreen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 cursor-pointer"
                />
                로그인 상태 유지
                <span className="text-muted-foreground text-[11px]">
                  (다음 접속 시 이메일이 자동 입력됩니다)
                </span>
              </label>
            )}

            {/* P0-05 (외부 평가) — 이메일·비번 유효성 미통과 시 disabled +
                아이콘 변화. aria-disabled 로 스크린리더 안내 보강. */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              aria-disabled={isLoading || !isFormValid}
              className="mt-1.5 inline-flex h-[52px] items-center justify-center gap-2.5 rounded-md bg-evergreen px-4 text-[15px] font-semibold text-white hover:bg-evergreen-strong active:translate-y-px transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0"
            >
              {isLoading ? (
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

            {/* P0-02 (외부 평가, 카카오 브랜드 가이드 정합) — #FEE500 배경 +
                심볼 + rgba(0,0,0,0.85) 텍스트.
                v3.6 외부 평가 #1.2·1.3 — font-bold (semibold→bold) + flex
                items-center 명시로 아이콘 세로 중앙 정렬 보정. */}
            <button
              type="button"
              onClick={handleKakao}
              disabled={isLoading}
              className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-md bg-[#FEE500] text-[15px] font-bold text-[rgba(0,0,0,0.85)] hover:brightness-[0.96] active:translate-y-px transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEE500] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0"
            >
              <KakaoSymbol className="text-[rgba(0,0,0,0.9)] shrink-0" />
              <span className="leading-none">카카오로 계속하기</span>
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
            <div
              role="alert"
              aria-live="polite"
              className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/5 border border-destructive/30 px-3.5 py-2.5 text-[13px] text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
              <span className="leading-[1.55]">{error}</span>
            </div>
          )}
          {message && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 flex items-start gap-2 rounded-lg bg-info/5 border border-info/30 px-3.5 py-2.5 text-[13px] text-info"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
              <span className="leading-[1.55] whitespace-pre-line">{message}</span>
            </div>
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
