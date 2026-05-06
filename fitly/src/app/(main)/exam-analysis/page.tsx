import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import {
  Calendar,
  ShieldAlert,
  BookOpen,
  Layers,
  Activity,
  Network,
  Compass,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { userProfiles, examPapers, examItems } from "@/lib/db/schema";
import { safeRun } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

// 헌법 v3.0 제13조 — 기출 분석 페이지의 4 탭 (기출문제·분석·토픽맵·로드맵).
// 헌법 제3조의2 + 제15조 — 지역 교육청별 합격 컷·평균은 비공개이므로 보유 X.
// 헌법 제36조 — 첫 가치 마법 지점 1.
// 헌법 v3.5 발의 (대기) 제18조의3 — 객관식 시대(2002~2013)는 KeywordCard로 흡수, 풀이 출제 X.

type TabKey = "papers" | "analysis" | "topic" | "roadmap";

const TABS: { key: TabKey; label: string; icon: typeof Layers }[] = [
  { key: "papers", label: "기출 시험지", icon: Layers },
  { key: "analysis", label: "분석 (히트맵 3종)", icon: Activity },
  { key: "topic", label: "토픽맵", icon: Network },
  { key: "roadmap", label: "로드맵 S/A/B/C", icon: Compass },
];

export default async function ExamAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const requestedTab = (params.tab as string | undefined) ?? "papers";
  const tab: TabKey = TABS.some((t) => t.key === requestedTab)
    ? (requestedTab as TabKey)
    : "papers";

  const profile = await safeRun(
    "exam-analysis profile",
    async () => {
      const db = getDb();
      const [row] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.id))
        .limit(1);
      return row ?? null;
    },
    null,
  );
  const targetRegion = profile?.targetUniversity ?? null;

  const paperStats = await safeRun(
    "exam-analysis paperStats",
    async () => {
      const db = getDb();
      const [row] = await db
        .select({
          paperCount: sql<number>`count(*)::int`,
          yearMin: sql<number | null>`min(${examPapers.year})`,
          yearMax: sql<number | null>`max(${examPapers.year})`,
        })
        .from(examPapers);
      return (
        row ?? { paperCount: 0, yearMin: null, yearMax: null }
      );
    },
    {
      paperCount: 0,
      yearMin: null as number | null,
      yearMax: null as number | null,
    },
  );
  const itemStats = await safeRun(
    "exam-analysis itemStats",
    async () => {
      const db = getDb();
      const [row] = await db
        .select({ itemCount: sql<number>`count(*)::int` })
        .from(examItems);
      return row ?? { itemCount: 0 };
    },
    { itemCount: 0 },
  );

  const seedReady = (itemStats?.itemCount ?? 0) > 0;

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="기출 분석"
        subtitle="24년치 KICE 공식 기출의 영역·인지수준·문항형식·키워드 분포를 한눈에 확인합니다."
      />

      <div className="px-6 mx-auto max-w-7xl space-y-8">
        {/* 정직성 안내 + 메타 — 12-col, 위쪽 헤더 라인 */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <HonestyCard className="lg:col-span-8" />
          <RegionCard region={targetRegion} className="lg:col-span-4" />
        </section>

        <SectionRule />

        {/* KPI 줄 — 시드 카운트 */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="시험지 (papers)" value={paperStats?.paperCount ?? 0} unit="회분" />
          <StatCard
            label="문항 (items)"
            value={itemStats?.itemCount ?? 0}
            unit="개"
          />
          <StatCard
            label="학년도 범위"
            value={
              paperStats?.yearMin && paperStats?.yearMax
                ? `${paperStats.yearMin}~${paperStats.yearMax}`
                : "—"
            }
            unit=""
          />
          <StatCard
            label="시드 상태"
            value={seedReady ? "활성" : "대기"}
            unit=""
            accent={seedReady}
          />
        </section>

        {/* 탭 바 */}
        <nav className="border-b border-rule">
          <ul className="flex flex-wrap gap-1">
            {TABS.map((t) => {
              const active = t.key === tab;
              const Icon = t.icon;
              return (
                <li key={t.key}>
                  <Link
                    href={`/exam-analysis?tab=${t.key}`}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-[13px] rounded-t-md transition-colors ${
                      active
                        ? "bg-evergreen/10 text-evergreen font-medium"
                        : "text-muted-foreground hover:bg-surface-deep hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 탭 컨텐츠 */}
        <section>
          {tab === "papers" && <PapersTab seedReady={seedReady} />}
          {tab === "analysis" && <AnalysisTab seedReady={seedReady} />}
          {tab === "topic" && <TopicTab seedReady={seedReady} />}
          {tab === "roadmap" && <RoadmapTab seedReady={seedReady} />}
        </section>
      </div>
    </div>
  );
}

// --- presentation parts -----------------------------------------------------

function SectionRule() {
  return <div className="h-px bg-rule" aria-hidden />;
}

function HonestyCard({ className = "" }: { className?: string }) {
  return (
    <Card className={`${className} border-warning/40 bg-warning/[0.06]`}>
      <CardContent className="p-6 flex gap-3">
        <ShieldAlert
          className="h-5 w-5 text-warning shrink-0 mt-0.5"
          aria-hidden
        />
        <div className="text-[13px] text-foreground/85 leading-relaxed">
          <p className="font-serif text-base font-medium text-foreground">
            지역별 합격 컷·평균을 보여드리지 않는 이유
          </p>
          <p className="mt-1.5">
            대부분의 시도교육청이 임용 합격 점수 컷을 <strong>비공개</strong>
            합니다. Fitly는 임의 추정값을 만들어 보여드리지 않습니다 (헌법
            제3조의2 4항). 대신 24년치 공개 기출(KICE)을 기반으로
            <strong> 출제 트렌드·풀이·키워드</strong>를 자동 시각화하여, 본인
            학습의 방향과 페이스를 결정하실 수 있게 돕습니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function RegionCard({
  region,
  className = "",
}: {
  region: string | null;
  className?: string;
}) {
  return (
    <Card className={`${className} border-rule`}>
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" aria-hidden />
          <span className="text-[11px] uppercase tracking-[0.12em]">
            내 지역 교육청
          </span>
        </div>
        {region ? (
          <p className="mt-3 font-serif text-2xl font-medium tracking-tight">
            {region}
          </p>
        ) : (
          <p className="mt-3 text-[12.5px] text-muted-foreground leading-relaxed">
            설정에서 지역 교육청을 등록하시면 시험 정보가 표시됩니다 (선택
            입력).
          </p>
        )}
        <p className="mt-auto pt-3 text-[10.5px] text-muted-foreground">
          헌법 제15조 — 시험일·과목·시험장소 등 공개된 정보만 노출.
        </p>
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: string | number;
  unit: string;
  accent?: boolean;
}) {
  return (
    <Card className="border-rule">
      <CardContent className="p-5">
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span
            className={`font-serif text-3xl font-medium tabular-nums tracking-tight ${
              accent ? "text-evergreen" : "text-foreground"
            }`}
          >
            {value}
          </span>
          {unit && (
            <span className="text-[12px] text-muted-foreground">{unit}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptySeedNotice({ tabHint }: { tabHint: string }) {
  return (
    <Card className="border-rule border-dashed">
      <CardContent className="p-8 text-center">
        <BookOpen
          className="h-6 w-6 mx-auto text-muted-foreground"
          aria-hidden
        />
        <p className="mt-3 font-serif text-base font-medium tracking-tight">
          시드 적재 후 자동 활성화됩니다
        </p>
        <p className="mt-2 text-[12.5px] text-muted-foreground leading-relaxed max-w-xl mx-auto">
          KICE 공식 기출 PDF 시드 파이프라인(<code>fitly/kice_pdfs/</code>)이
          적재되면 본 탭에 {tabHint}가 자동으로 표시됩니다. 본 페이지의
          시각화는 모두 24년치 공식 기출에서 자동 생성되며, 외부 학원·인강
          자료에 의존하지 아니합니다 (헌법 제27조).
        </p>
      </CardContent>
    </Card>
  );
}

// --- tab contents -----------------------------------------------------------

function PapersTab({ seedReady }: { seedReady: boolean }) {
  if (!seedReady) {
    return (
      <EmptySeedNotice tabHint="2002~2026학년도 24회분 시험지 메타(연도·구분·검증 상태)" />
    );
  }
  return (
    <Card className="border-rule">
      <CardContent className="p-0">
        <table className="w-full text-[13px]">
          <thead className="bg-surface-deep/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3">학년도</th>
              <th className="text-left px-5 py-3">구분</th>
              <th className="text-right px-5 py-3 tabular-nums">문항 수</th>
              <th className="text-right px-5 py-3 tabular-nums">총점</th>
              <th className="text-left px-5 py-3">검증</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {/* 시드 적재 후 examPapers JOIN으로 자동 채워짐 */}
            <tr>
              <td colSpan={5} className="text-center text-muted-foreground py-8">
                JOIN 결과 표시 영역
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function AnalysisTab({ seedReady }: { seedReady: boolean }) {
  if (!seedReady) {
    return (
      <div className="space-y-4">
        <EmptySeedNotice tabHint="영역×연도 / 인지수준×연도 / 문항형식×연도 히트맵 3종" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <HeatmapPreview title="영역 × 연도" subtitle="11과목 + 교육학" />
          <HeatmapPreview
            title="인지수준 × 연도"
            subtitle="기억·이해·적용·분석·평가·창작 (Bloom)"
          />
          <HeatmapPreview
            title="문항형식 × 연도"
            subtitle="객관식·단답형·서술형·논술형"
          />
        </div>
      </div>
    );
  }
  return <div className="text-muted-foreground">분석 (히트맵 시각화)</div>;
}

function HeatmapPreview({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <Card className="border-rule">
      <CardContent className="p-5">
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </div>
        <div className="mt-1 text-[12.5px] text-foreground/80">{subtitle}</div>
        <div
          className="mt-4 grid gap-[2px] opacity-60"
          style={{ gridTemplateColumns: "repeat(8, 1fr)" }}
          aria-hidden
        >
          {Array.from({ length: 56 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-rule/60 rounded-[1px]"
              style={{ opacity: 0.3 + ((i * 13) % 7) / 10 }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TopicTab({ seedReady }: { seedReady: boolean }) {
  if (!seedReady) {
    return (
      <EmptySeedNotice tabHint="반복 출제 키워드 클라우드 + 영역별 토픽 그래프" />
    );
  }
  return <div className="text-muted-foreground">토픽맵</div>;
}

function RoadmapTab({ seedReady }: { seedReady: boolean }) {
  if (!seedReady) {
    return (
      <div className="space-y-4">
        <EmptySeedNotice tabHint="S/A/B/C 4 등급 학습 우선순위 자동 분배 + 시험일 역산 페이스" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(["S", "A", "B", "C"] as const).map((grade, idx) => (
            <Card key={grade} className="border-rule">
              <CardContent className="p-5">
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {grade}등급
                </div>
                <div className="mt-2 font-serif text-2xl font-medium tracking-tight">
                  —
                </div>
                <p className="mt-2 text-[11.5px] text-muted-foreground leading-relaxed">
                  {idx === 0 && "출제 빈도 최상위 — 시험 직전까지 회독"}
                  {idx === 1 && "출제 빈도 상위 — 주 2회 회독"}
                  {idx === 2 && "출제 빈도 중위 — 주 1회 회독"}
                  {idx === 3 && "출제 빈도 하위 — 시간 여유 시 학습"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  return <div className="text-muted-foreground">로드맵</div>;
}
