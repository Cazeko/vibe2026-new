import { AuthForm } from "@/components/feature/auth/auth-form";

export default function LoginPage() {
  return (
    <section className="w-full max-w-sm animate-fade-up">
      <div className="mb-8 flex flex-col items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-evergreen text-primary-foreground font-serif italic font-medium text-xl">
          F
        </span>
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          로그인
        </h1>
        <p className="text-[13px] text-muted-foreground text-center">
          다시 학습으로 돌아오신 것을 환영합니다.
        </p>
      </div>
      <AuthForm mode="login" />
    </section>
  );
}
