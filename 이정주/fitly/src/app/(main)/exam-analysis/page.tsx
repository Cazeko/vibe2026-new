import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Star, BookOpen, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  SectionBars,
  type SectionBarItem,
} from "@/components/feature/analysis/section-bars";
import { UNIVERSITY_SEEDS } from "@/lib/data/universities";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const SHORT_NAME: Record<string, string> = {
  한양: "한양대",
  중앙: "중앙대",
  성균관: "성균관대",
  경희: "경희대",
  이화: "이화여대",
  서강: "서강대",
  홍익: "홍익대",
  동국: "동국대",
  건국: "건국대",
  숭실: "숭실대",
};

// 헌법 v1.10 — 기출 분석 (TOP 10 대학 가중치/컷 비교 + 본인 목표 강조).
// 한양대 5년 50건 RAG 시드 완료 전까지는 합격 컷·평균 시드 + 본인 목표 카드를 노출한다.
export default async function ExamAnalysisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = getDb();
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  const target = profile?.targetUniversity ?? null;

  const weightChartData: SectionBarItem[] = UNIVERSITY_SEEDS.map((u) => ({
    label: SHORT_NAME[u.name] ?? u.name,
    vocab: u.weights.vocab,
    grammar: u.weights.grammar,
    reading: u.weights.reading,
  }));

  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="기출 분석"
        subtitle="TOP 10 대학의 출제 패턴·합격 컷·평균을 데이터로 비교합니다."
      />

      <div className="px-6 grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Card className="xl:col-span-2 rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">학교별 영역 가중치</h2>
              <span className="text-[11px] text-muted-foreground">
                Fit 공식 가중치 (제9·11조)
              </span>
            </div>
            <div className="mt-2 h-56">
              <SectionBars data={weightChartData} />
            </div>
            <p className="mt-2 text-[10.5px] text-muted-foreground">
              ※ 본 가중치는 5년 50건 기출 분석 역산 시드입니다 (제11조 1항). 한양대
              5년 50건 RAG 시드 완료 시 자동 갱신됩니다.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)] bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/15 dark:to-violet-500/10">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-sm font-bold">내 목표 학교</h2>
            </div>
            {target ? (
              (() => {
                const seed = UNIVERSITY_SEEDS.find((u) => u.name === target);
                if (!seed) return null;
                return (
                  <div className="mt-3 space-y-2 flex-1">
                    <p className="text-2xl font-bold tracking-tight">
                      {SHORT_NAME[seed.name] ?? seed.name}
                    </p>
                    <ul className="space-y-1.5 text-[12px] text-foreground/80">
                      <li className="flex justify-between">
                        <span>가중치</span>
                        <span className="font-medium">
                          어{seed.weights.vocab} · 문{seed.weights.grammar} · 독
                          {seed.weights.reading}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>어휘 컷·평균</span>
                        <span className="font-medium">
                          {seed.cutoffs.vocab_cut} / {seed.cutoffs.vocab_avg}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>문법 컷·평균</span>
                        <span className="font-medium">
                          {seed.cutoffs.grammar_cut} / {seed.cutoffs.grammar_avg}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>독해 컷·평균</span>
                        <span className="font-medium">
                          {seed.cutoffs.reading_cut} / {seed.cutoffs.reading_avg}
                        </span>
                      </li>
                    </ul>
                  </div>
                );
              })()
            ) : (
              <p className="mt-2 text-[12px] text-muted-foreground flex-1">
                설정에서 목표 학교를 등록하면 학교별 학습 전략이 활성화됩니다.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3 rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-sm font-bold">대학별 합격 컷·평균</h2>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="text-left text-[11px] text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <th className="py-2 font-medium">학교</th>
                    <th className="py-2 font-medium">가중치 (어/문/독)</th>
                    <th className="py-2 font-medium">어휘 컷/평균</th>
                    <th className="py-2 font-medium">문법 컷/평균</th>
                    <th className="py-2 font-medium">독해 컷/평균</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {UNIVERSITY_SEEDS.map((u) => {
                    const isTarget = u.name === target;
                    return (
                      <tr
                        key={u.name}
                        className={isTarget ? "bg-primary/5" : ""}
                      >
                        <td className="py-2 font-medium">
                          {SHORT_NAME[u.name] ?? u.name}
                          {isTarget && (
                            <span className="ml-1.5 text-[9.5px] font-semibold text-primary">
                              내 목표
                            </span>
                          )}
                        </td>
                        <td className="py-2 tabular-nums">
                          {u.weights.vocab} / {u.weights.grammar} /{" "}
                          {u.weights.reading}
                        </td>
                        <td className="py-2 tabular-nums">
                          {u.cutoffs.vocab_cut} / {u.cutoffs.vocab_avg}
                        </td>
                        <td className="py-2 tabular-nums">
                          {u.cutoffs.grammar_cut} / {u.cutoffs.grammar_avg}
                        </td>
                        <td className="py-2 tabular-nums">
                          {u.cutoffs.reading_cut} / {u.cutoffs.reading_avg}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[10.5px] text-muted-foreground">
              ※ 본 시드 데이터는 헌법 제11조 2항(공시·합격 수기·인터뷰 3종 교차 검증)
              완료 시 RAG 인덱싱 결과로 대체됩니다.
            </p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3 rounded-2xl border-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-sm font-bold">출제 빈도 상위 유형</h2>
            </div>
            <ul className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
              {[
                { type: "어휘 추론", weight: 22 },
                { type: "문장 삽입", weight: 18 },
                { type: "비동사/준동사", weight: 15 },
                { type: "관계사", weight: 12 },
                { type: "빈칸 추론", weight: 18 },
                { type: "독해 일반", weight: 15 },
              ].map(({ type, weight }) => (
                <li
                  key={type}
                  className="rounded-xl border border-border/50 bg-background px-3 py-2.5"
                >
                  <p className="text-[11px] text-muted-foreground">{type}</p>
                  <p className="mt-1 text-base font-bold">{weight}%</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10.5px] text-muted-foreground">
              ※ TOP 10 평균 시드값 (50건 기출 가중 평균). 학교별 세부 분포는 RAG 시드
              완료 후 노출됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
