import type { Metadata } from "next";
import { FitlySignIn } from "@/components/feature/auth/fitly-sign-in";

// N1 — 페이지별 metadata (헌법 제24조의2 정합)
export const metadata: Metadata = {
  title: "회원가입 · Fitly",
  description: "이메일 한 줄로 24년치 공식 기출에 접근하세요. 무료입니다.",
};

export default function SignupPage() {
  return <FitlySignIn mode="signup" />;
}
