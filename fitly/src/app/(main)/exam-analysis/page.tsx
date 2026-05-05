import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Star, BookOpen, Calendar, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { UNIVERSITY_SEEDS } from "@/lib/data/universities";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

// 헌법 v2.0 제3조의2 + 제15조 — 학교별 합격 컷·평균은 비공개이므로 보유 X.
// 본 페이지는 *공개된 시험 정보*(시험 시기·과목 구성·문항 수)만 노출한다.
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
  const targetSeed = UNIVERSITY_SEEDS.find((u) => u.name === target) ?? null;

  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="기출 분석"
        subtitle="학교별 시험 시기·과목 구성 등 공개된 정보를 한눈에 확인합니다."
      />

      <div className="px-6 grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* 정직 안내 */}
        <Card className="xl:col-span-3 border-warning/40 bg-warning/[0.06]">
          <CardContent className="p-5 flex gap-3">
            <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" aria-hidden />
            <div className="text-[12.5px] text-foreground/85 leading-relaxed">
              <p className="font-semibold text-foreground">합격 컷·평균을 보여드리지 않는 이유</p>
              <p className="mt-1">
                대부분의 학교가 편입 영어 합격 점수 컷을 <strong>비공개</strong>합니다. Fitly 는 임의 추정값으로 그것을 *만들어 보여주지 않습니다* (헌법 제3조의2 4항).
                대신 학교별로 *실제 공개된* 시험 시기·과목 구성·문항 수만 표시하고, 학습의 핵심은 <strong>본인 자료를 자동 카드화 + SRS 복습 + 진척도 추적</strong> 으로 채웁니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 내 목표 학교 */}
        <Card className="xl:col-span-2 border-rule">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-evergreen" aria-hidden />
              <h2 className="font-serif text-lg font-medium tracking-tight">내 목표 학교</h2>
            </div>
            {targetSeed ? (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1 rounded-lg border border-rule bg-background px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">학교</p>
                  <p className="mt-1 font-serif text-2xl font-medium tracking-tight">
                    {targetSeed.shortName}
                  </p>
                </div>
                <div className="rounded-lg border border-rule bg-background px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">시험 시기</p>
                  <p className="mt-1 font-serif text-base font-medium">
                    {targetSeed.examMonth ?? "공지 미상"}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                    매년 학교 공지에 따라 변동
                  </p>
                </div>
                <div className="rounded-lg border border-rule bg-background px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">총 문항 수</p>
                  <p className="mt-1 font-serif text-base font-medium num">
                    {targetSeed.totalQuestions ? `약 ${targetSeed.totalQuestions}문항` : "—"}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                    공개 자료 기준
                  </p>
                </div>
                {targetSeed.sections && (
                  <div className="md:col-span-3 rounded-lg border border-rule bg-background px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      과목 구성 (공개 자료 추정)
                    </p>
                    <ul className="mt-2 grid grid-cols-3 gap-2">
                      {targetSeed.sections.map((s) => (
                        <li
                          key={s.key}
                          className="rounded-md bg-secondary px-3 py-2 text-center"
                        >
                          <p className="text-[11px] text-muted-foreground">{s.label}</p>
                          <p className="mt-0.5 font-serif text-sm font-medium num">
                            {s.approxQuestions ? `≈ ${s.approxQuestions}문항` : "—"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-muted-foreground">
                설정에서 목표 학교를 등록하시면 학교별 시험 정보가 표시됩니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 학습 가이드 */}
        <Card className="border-evergreen bg-evergreen/[0.06]">
          <CardContent className="p-5 h-full flex flex-col">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-evergreen" aria-hidden />
              <h2 className="font-serif text-lg font-medium tracking-tight">학교 정보 → 학습 전략</h2>
            </div>
            <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-foreground/85 flex-1">
              <li>• 시험 시기를 알면 <strong>학습 플랜</strong>이 D-day로 자동 역산됩니다.</li>
              <li>• 과목 구성을 알면 <strong>어휘·문법·독해</strong> 비중을 본인이 조절할 수 있습니다.</li>
              <li>• 합격 컷은 비공개라서 *목표 점수는 본인이 정합니다*. 우리는 진척도만 정직하게 보여줍니다.</li>
            </ul>
          </CardContent>
        </Card>

        {/* 학교별 시험 정보 표 */}
        <Card className="xl:col-span-3 border-rule">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-evergreen" aria-hidden />
              <h2 className="font-serif text-lg font-medium tracking-tight">학교별 시험 정보</h2>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="text-left text-[11px] text-muted-foreground">
                  <tr className="border-b border-rule">
                    <th className="py-2 font-medium">학교</th>
                    <th className="py-2 font-medium">시험 시기</th>
                    <th className="py-2 font-medium">총 문항 수</th>
                    <th className="py-2 font-medium">합격 컷·평균</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {UNIVERSITY_SEEDS.map((u) => {
                    const isTarget = u.name === target;
                    return (
                      <tr
                        key={u.name}
                        className={isTarget ? "bg-evergreen/[0.04]" : ""}
                      >
                        <td className="py-2 font-medium">
                          {u.shortName}
                          {isTarget && (
                            <span className="ml-1.5 text-[9.5px] font-semibold text-evergreen">
                              내 목표
                            </span>
                          )}
                        </td>
                        <td className="py-2">{u.examMonth ?? "공지 미상"}</td>
                        <td className="py-2 num">
                          {u.totalQuestions ? `약 ${u.totalQuestions}문항` : "—"}
                        </td>
                        <td className="py-2 text-muted-foreground italic">
                          학교 비공개
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[10.5px] text-muted-foreground">
              ※ 본 표의 시험 정보는 *시연용 시드* 입니다. 정확한 일자·문항 수는 매년 학교 공지를 따릅니다.
              합격 점수 컷·평균은 <strong>학교가 비공개</strong>이며, Fitly 는 임의 추정값을 제공하지 않습니다 (헌법 제3조의2).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

