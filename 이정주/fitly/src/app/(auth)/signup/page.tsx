import { AuthForm } from "@/components/feature/auth/auth-form";

export default function SignupPage() {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-12 animate-fade-up">
      <div className="mb-8 flex flex-col items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-evergreen text-primary-foreground font-serif italic font-medium text-xl">
          F
        </span>
        <h1 className="font-serif text-3xl font-medium tracking-tight">회원가입</h1>
        <p className="font-serif text-sm text-muted-foreground text-center text-balance">
          내 자료를 AI 카드로 만들기까지 3번의 탭, 무료입니다.
        </p>
      </div>
      <AuthForm mode="signup" />
    </section>
  );
}
