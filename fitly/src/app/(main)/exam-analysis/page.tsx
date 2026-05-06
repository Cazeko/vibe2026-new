import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Calendar, ShieldAlert, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

// 헌법 v3.0 제13조 — 기출 분석 페이지의 4개 탭 (기출문제·분석·토픽맵·로드맵)은
// D-S2 시드 적재 후 reimplement. 본 페이지는 시드 미적재 시점의 정직 안내 placeholder.
// 헌법 v3.0 제3조의2 + 제15조 — 지역 교육청별 합격 컷·평균은 비공개이므로 보유 X.
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

  // v3.0 — userProfiles.targetUniversity 컬럼은 region 라벨로 임시 재해석.
  const targetRegion = profile?.targetUniversity ?? null;

  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="기출 분석"
        subtitle="24년치 KICE 공식 기출의 영역·인지수준·문항형식·키워드 분포를 한눈에 확인합니다."
      />

      <div className="px-6 grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* 정직 안내 — v3.0 제3조의2 */}
        <Card className="xl:col-span-3 border-warning/40 bg-warning/[0.06]">
          <CardContent className="p-5 flex gap-3">
            <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" aria-hidden />
            <div className="text-[12.5px] text-foreground/85 leading-relaxed">
              <p className="font-semibold text-foreground">
                지역별 합격 컷·평균을 보여드리지 않는 이유
              </p>
              <p className="mt-1">
                대부분의 시도교육청이 임용 합격 점수 컷을 <strong>비공개</strong> 합니다.
                Fitly 는 임의 추정값을 만들어 보여주지 않습니다 (헌법 v3.0 제3조의2 4항).
                대신 24년치 공개 기출(KICE)을 기반으로 <strong>출제 트렌드·풀이·키워드</strong> 를
                자동 시각화하여, 본인 학습의 방향과 페이스를 결정하실 수 있게 돕습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 내 지역 교육청 */}
        <Card className="xl:col-span-2 border-rule">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-evergreen" aria-hidden />
              <h2 className="font-serif text-lg font-medium tracking-tight">
                내 지역 교육청
              </h2>
            </div>
            {targetRegion ? (
              <p className="mt-3 font-serif text-2xl font-medium tracking-tight">
                {targetRegion}
              </p>
            ) : (
              <p className="mt-2 text-[12px] text-muted-foreground">
                설정에서 지역 교육청을 등록하시면 시험 정보가 표시됩니다 (선택 입력).
              </p>
            )}
            <p className="mt-2 text-[10.5px] text-muted-foreground">
              헌법 v3.0 제15조 — 시험일·과목·시험장소 등 공개된 정보만 노출.
            </p>
          </CardContent>
        </Card>

        {/* 학습 가이드 */}
        <Card className="border-evergreen bg-evergreen/[0.06]">
          <CardContent className="p-5 h-full flex flex-col">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-evergreen" aria-hidden />
              <h2 className="font-serif text-lg font-medium tracking-tight">
                기출 분석으로 학습 전략
              </h2>
            </div>
            <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-foreground/85 flex-1">
              <li>
                • <strong>영역 히트맵</strong> 으로 출제 빈도가 높은 영역을 우선
                학습합니다.
              </li>
              <li>
                • <strong>토픽맵</strong> 으로 반복 출제되는 키워드를 식별합니다.
              </li>
              <li>
                • <strong>로드맵 (S/A/B/C)</strong> 으로 시험일까지 학습 우선순위를
                자동 분배합니다.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 시드 미적재 placeholder — D-S2에서 4개 탭 reimplement */}
        <Card className="xl:col-span-3 border-rule">
          <CardContent className="p-5">
            <h2 className="font-serif text-lg font-medium tracking-tight">
              4개 탭 — 기출문제·분석·토픽맵·로드맵
            </h2>
            <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">
              시드 파이프라인 (D-S2~) 적재 후 이 자리에 영역×연도 / 인지수준×연도 /
              문항형식×연도 히트맵 3종 + 키워드 클라우드 + 우선순위 로드맵이 표시됩니다.
              본 페이지의 시각화는 모두 24년치 KICE 공식 기출 PDF (
              <code>fitly/kice_pdfs/</code>) 시드에서 자동 생성되며, 외부 학원·인강
              자료에 의존하지 아니합니다 (헌법 v3.0 제27조).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
