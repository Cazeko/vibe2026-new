import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/shared/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitly — 편입영어 학습 적합도 OS",
  description: "편입은 열심히 하는 게 아니라, 맞게(Fit) 하는 게임입니다.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Fitly",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
