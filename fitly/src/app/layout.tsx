import type { Metadata, Viewport } from "next";
import { Newsreader, Geist, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { PwaRegister } from "@/components/shared/pwa-register";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// v3.6 외부 평가 #5.15 — 파비콘·OG 메타태그 보강. Twitter Card·Open Graph·
// canonical·robots 정합으로 외부 공유 시 프로페셔널한 미리보기.
export const metadata: Metadata = {
  metadataBase: new URL("https://vibe2026-fitly.vercel.app"),
  title: {
    default: "Fitly — 초등 임용 1차 학습 플래너",
    template: "%s · Fitly",
  },
  description:
    "합격은 시간이 아니라 적합도다. 24년치 공식 기출·17개 시도 합격선·역산 학습 플래너로 임용 1차를 준비하세요.",
  keywords: [
    "초등 임용",
    "임용고시",
    "학습 플래너",
    "기출 분석",
    "교직논술",
    "교육과정",
    "Fitly",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Fitly",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "Fitly — 초등 임용 1차 학습 플래너",
    description:
      "합격은 시간이 아니라 적합도다. 24년치 공식 기출 데이터로 자기 진척도 분석.",
    siteName: "Fitly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fitly — 초등 임용 1차 학습 플래너",
    description:
      "합격은 시간이 아니라 적합도다. 24년치 공식 기출 데이터로 자기 진척도 분석.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6EE" },
    { media: "(prefers-color-scheme: dark)", color: "#11151B" },
  ],
  width: "device-width",
  initialScale: 1,
  // userScalable·maximumScale 제거 — 사용자 zoom 차단은 WCAG 1.4.4 위반 (시각
  // 약자가 텍스트 확대 못 함). PWA 설치 후에도 사용자가 자유롭게 zoom 가능.
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`h-full ${newsreader.variable} ${geist.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
