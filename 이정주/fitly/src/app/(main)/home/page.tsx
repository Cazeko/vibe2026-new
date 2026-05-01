import { FitGauge } from "@/components/feature/fit/fit-gauge";

export default function HomePage() {
  return (
    <section className="mx-auto w-full max-w-md px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">홈</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          오늘의 학습 적합도를 확인하세요.
        </p>
      </header>
      <FitGauge value={0} />
    </section>
  );
}
