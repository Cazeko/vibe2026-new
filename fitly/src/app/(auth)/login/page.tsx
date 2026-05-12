import type { Metadata } from "next";
import { FitlySignIn } from "@/components/feature/auth/fitly-sign-in";

// N1 — 페이지별 metadata (헌법 제24조의2 정합)
export const metadata: Metadata = {
  title: "로그인 · Fitly",
  description: "Fitly에 로그인하고 학습 플래너로 들어가세요.",
};

export default function LoginPage() {
  return <FitlySignIn mode="login" />;
}
