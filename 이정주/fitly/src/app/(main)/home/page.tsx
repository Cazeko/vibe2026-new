"use client";

import { useEffect, useState } from "react";
import { FitGauge } from "@/components/feature/fit/fit-gauge";
import {
  ScoreForm,
  type ScoreFormValues,
} from "@/components/feature/fit/score-form";
import { Card, CardContent } from "@/components/ui/card";
import { DDayCard } from "@/components/feature/home/dday-card";
import { PatternChart } from "@/components/feature/home/pattern-chart";
import { TodayActions } from "@/components/feature/home/today-actions";
import { useFitScore } from "@/hooks/use-fit-score";
import { getUniversitySeed } from "@/lib/data/universities";
import type { UniversityName } from "@/types";

type ProfileState = {
  targetUniversity: UniversityName | null;
  examDate: string | null;
};

export default function HomePage() {
  const [values, setValues] = useState<ScoreFormValues | null>(null);
  const [profile, setProfile] = useState<ProfileState>({
    targetUniversity: null,
    examDate: null,
  });

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile({
            targetUniversity: (d.profile.targetUniversity ?? null) as
              | UniversityName
              | null,
            examDate: d.profile.examDate ?? null,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  const targetUniversity = values?.university ?? profile.targetUniversity;
  const seed = getUniversitySeed(targetUniversity);
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
    <section className="mx-auto w-full max-w-md px-4 py-6 space-y-6 animate-fade-up">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">홈</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          오늘의 학습 적합도와 D-day를 확인하세요.
        </p>
      </header>

      <DDayCard
        examDate={profile.examDate}
        university={profile.targetUniversity}
      />

      <FitGauge value={fit?.total ?? 0} university={targetUniversity ?? undefined} />

      {fit && values && (
        <Card>
          <CardContent className="grid grid-cols-3 gap-3 p-4 text-center">
            <Stat label="어휘" value={fit.vocab} />
            <Stat label="문법" value={fit.grammar} />
            <Stat label="독해" value={fit.reading} />
          </CardContent>
        </Card>
      )}

      <PatternChart weights={seed?.weights ?? null} />

      <TodayActions />

      <ScoreForm onChange={setValues} />

      <p className="text-[11px] text-muted-foreground">
        본 화면의 합격 컷·평균은 데모 데이터입니다. 실제 데이터로 교체될
        예정이며, 공시·합격 수기·인터뷰의 교차 검증을 거칩니다 (헌법 제11조).
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="num text-xl font-bold">{value}</p>
    </div>
  );
}
