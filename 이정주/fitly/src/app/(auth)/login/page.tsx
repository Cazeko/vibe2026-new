import { AuthForm } from "@/components/feature/auth/auth-form";

export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-12 animate-fade-up">
      <div className="mb-8 flex flex-col items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl gauge-gradient text-white text-xl font-extrabold">
          F
        </span>
        <h1 className="text-2xl font-bold tracking-tight">로그인</h1>
        <p className="text-sm text-muted-foreground text-center text-balance">
          편입은 열심히가 아니라, 맞게(Fit) 하는 게임입니다.
        </p>
      </div>
      <AuthForm mode="login" />
    </section>
  );
}
