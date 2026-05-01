"use client";

import { useState } from "react";
import { FitGauge } from "@/components/feature/fit/fit-gauge";
import {
  ScoreForm,
  type ScoreFormValues,
} from "@/components/feature/fit/score-form";
import { useFitScore } from "@/hooks/use-fit-score";
import { getUniversitySeed } from "@/lib/data/universities";

export default function HomePage() {
  const [values, setValues] = useState<ScoreFormValues | null>(null);

  const seed = getUniversitySeed(values?.university ?? null);
  const fit = useFitScore(
    values
      ? {
          vocab: values.vocab,
          grammar: values.grammar,
          reading: values.reading,
        }
      : null,
    seed?.cutoffs ?? null,
    seed?.weights ?? null
  );

  return (
    <section className="mx-auto w-full max-w-md px-4 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">홈</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          오늘의 학습 적합도를 확인하세요.
        </p>
      </header>

      <FitGauge
        value={fit?.total ?? 0}
        university={values?.university}
      />

      <ScoreForm onChange={setValues} />

      <p className="text-[11px] text-muted-foreground">
        본 화면의 합격 컷·평균은 데모 데이터입니다. 실제 데이터로 교체될
        예정이며, 공시·합격 수기·인터뷰의 교차 검증을 거칩니다 (헌법 제11조).
      </p>
    </section>
  );
}
