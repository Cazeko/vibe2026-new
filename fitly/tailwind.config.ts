import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // ── shadcn 호환 시멘틱 토큰 ──
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ── DESIGN.md v1 + 신규 디자인 (2026-05-12) 직접 토큰 ──
        cream: {
          DEFAULT: "hsl(var(--color-bg))",
          soft: "hsl(var(--color-surface))",
          deep: "hsl(var(--color-surface-deep))",
          paper: "hsl(var(--color-paper))",
        },
        ink: {
          DEFAULT: "hsl(var(--color-text))",
          2: "hsl(var(--color-text-2))",
        },
        muted2: {
          DEFAULT: "hsl(var(--color-text-muted))",
          deep: "hsl(var(--color-text-muted-deep))",
        },
        evergreen: {
          DEFAULT: "hsl(var(--color-accent))",
          strong: "hsl(var(--color-accent-strong))",
          mid: "hsl(var(--color-accent-2))",
          soft: "hsl(var(--color-accent-soft))",
        },
        gold: {
          DEFAULT: "hsl(var(--color-gold))",
          soft: "hsl(var(--color-gold-soft))",
        },
        rule: {
          DEFAULT: "hsl(var(--color-rule))",
          soft: "hsl(var(--color-rule-soft))",
          strong: "hsl(var(--color-rule-strong))",
        },
        warning: {
          DEFAULT: "hsl(var(--color-warning))",
          // Track 2.2 (v3.5.4 WCAG) — text-warning-text 으로 본문 텍스트 ≥4.5:1.
          text: "hsl(var(--color-warning-text))",
        },
        error: "hsl(var(--color-error))",
        info: "hsl(var(--color-info))",

        // Track 3 (v3.5.4 — DESIGN §4.4.1) — 영역 분류용 좌측 보더 hue.
        // 사용 예: `border-l-[3px] border-l-subject-1`. 8과목 이상은 mod 7 순환.
        "subject-1": "hsl(var(--subject-1))",
        "subject-2": "hsl(var(--subject-2))",
        "subject-3": "hsl(var(--subject-3))",
        "subject-4": "hsl(var(--subject-4))",
        "subject-5": "hsl(var(--subject-5))",
        "subject-6": "hsl(var(--subject-6))",
        "subject-7": "hsl(var(--subject-7))",

        // ── 헌법 v1.9 데시보드 캔버스/사이드바 토큰 (호환 유지) ──
        "app-bg": "hsl(var(--app-bg))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",                      // 8px
        md: "calc(var(--radius) - 2px)",          // 6px
        sm: "calc(var(--radius) - 4px)",          // 4px
        card: "var(--radius-card)",               // 14px — 신규 디자인 카드
      },
      fontFamily: {
        // 헤드라인·KPI 큰 숫자 (DESIGN.md §3)
        serif: [
          "var(--font-newsreader)",
          "var(--font-noto-serif-kr)",
          "Georgia",
          "serif",
        ],
        "serif-en": [
          "var(--font-newsreader)",
          "Georgia",
          "serif",
        ],
        "serif-kr": [
          "var(--font-noto-serif-kr)",
          "var(--font-newsreader)",
          "Georgia",
          "serif",
        ],
        // 본문·UI (Pretendard 한글 우선, Geist 영문)
        sans: [
          "var(--font-pretendard)",
          "var(--font-geist)",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Apple SD Gothic Neo",
          "sans-serif",
        ],
        "sans-en": [
          "var(--font-geist)",
          "var(--font-pretendard)",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        // 코드 (희소 사용)
        mono: [
          "var(--font-jetbrains-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 240ms ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
