import { AuthForm } from "@/components/feature/auth/auth-form";

export default function SignupPage() {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-12 animate-fade-up">
      <div className="mb-8 flex flex-col items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl gauge-gradient text-white text-xl font-extrabold">
          F
        </span>
        <h1 className="text-2xl font-bold tracking-tight">회원가입</h1>
        <p className="text-sm text-muted-foreground text-center text-balance">
          첫 Fit 점수까지 3번의 탭, 무료입니다.
        </p>
      </div>
      <AuthForm mode="signup" />
    </section>
  );
}
