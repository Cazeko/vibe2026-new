import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import {
  Calendar,
  ShieldAlert,
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
import {
  getCutScoresByRegion,
  type CutScoreRow,
} from "@/lib/exam-analysis/queries";
import { PapersTab } from "./_components/papers-tab";
import { AnalysisTab } from "./_components/analysis-tab";
import { TopicTab } from "./_components/topic-tab";
import { RoadmapTab } from "./_components/roadmap-tab";

export const dynamic = "force-dynamic";

// 기출 분석 페이지 — 4 탭 (기출 시험지·분석·토픽맵·로드맵).
// 합격 컷·확률 추정은 일체 표시하지 아니한다.

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
  searchParams: Promise<{ tab?: string; showAll?: string }>;
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
  // 분석 탭 토글 — 최근 5년 출제 0회 행을 노출/숨김
  const showAll = params.showAll === "1";

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

  // 사용자 지역의 1차 합격선 추이 (공개 사실 데이터)
  const cutScores: CutScoreRow[] = targetRegion
    ? await getCutScoresByRegion(targetRegion)
    : [];

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
        subtitle="24년치 공개 기출의 영역·인지수준·문항형식·키워드 분포를 한눈에 확인합니다."
      />

      <div className="px-6 mx-auto max-w-7xl space-y-6">
        {/* 정직성 안내 (컴팩트) + 내 지역 교육청 — 12-col grid.
            정직성 박스는 헤드라인 한 줄 + 펼치기 토글로 축소(헌법 v3.5.1 제4의3 줄바꿈 정합). */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <HonestyCard className="lg:col-span-8" />
          <RegionCard
            region={targetRegion}
            cutScores={cutScores}
            className="lg:col-span-4"
          />
        </section>

        <SectionRule />

        {/* KPI 줄 — 시드 카운트. 값 0 또는 null 인 stat 은 '—' 로 폴백하여
            '단독 0' 노출 회피 (사용자 보고 2026-05-12). */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="시험지"
            value={paperStats?.paperCount ? paperStats.paperCount : "—"}
            unit={paperStats?.paperCount ? "회분" : ""}
          />
          <StatCard
            label="문항"
            value={itemStats?.itemCount ? itemStats.itemCount : "—"}
            unit={itemStats?.itemCount ? "개" : ""}
          />
          <StatCard
            label="학년도 범위"
            value={
              paperStats?.yearMin && paperStats?.yearMax
                ? `${paperStats.yearMin}–${paperStats.yearMax}`
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
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-[13px] rounded-t-md transition-colors ${
                      active
                        ? "bg-evergreen/10 text-evergreen font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
          {tab === "papers" && <PapersTab />}
          {tab === "analysis" && <AnalysisTab showAll={showAll} />}
          {tab === "topic" && <TopicTab />}
          {tab === "roadmap" && <RoadmapTab />}
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
  // 컴팩트 디스클로저 — 헤드라인 한 줄만 노출, 펼치기 시 상세 표시.
  // 첫 화면 점유를 줄여 분석 콘텐츠가 즉시 보이도록 설계 (사용자 보고 2026-05-12).
  return (
    <Card
      className={`${className} border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30`}
    >
      <CardContent className="p-0">
        <details className="group">
          <summary className="cursor-pointer list-none px-5 py-4 flex items-center gap-3 select-none hover:bg-secondary/50 transition-colors">
            <ShieldAlert
              className="h-4 w-4 text-warning shrink-0"
              aria-hidden
            />
            <p className="font-serif text-[14.5px] font-medium tracking-tight text-foreground flex-1">
              정직성 원칙 — 표시하는 것과 만들지 않는 것
            </p>
            <span
              aria-hidden
              className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground group-open:hidden"
            >
              펼치기
            </span>
            <span
              aria-hidden
              className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground hidden group-open:inline"
            >
              접기
            </span>
          </summary>
          <div className="px-5 pb-4 pt-1 text-[12.5px] text-foreground/85 leading-relaxed border-t border-rule/60">
            <p className="mt-2.5">
              <strong>표시</strong>: 시도교육청이 공개한
              <br className="hidden sm:inline" /> 1차 합격선·경쟁률·모집 인원,
              24년치 공개 기출의 영역·인지수준·키워드 분포.
            </p>
            <p className="mt-1.5">
              <strong>만들지 않음</strong>: 합격 가능성·점수 예측·임의 추정값.
              본인 학습의 방향과 페이스 결정에 도움이 되는
              <br className="hidden sm:inline" /> 사실 데이터만 보여 드립니다.
            </p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

function RegionCard({
  region,
  cutScores,
  className = "",
}: {
  region: string | null;
  cutScores: CutScoreRow[];
  className?: string;
}) {
  // 학년도 내림차순으로 최대 3개만 표시
  const recent = cutScores.slice(0, 3);
  const anyVerified = cutScores.some((c) => c.verified);

  // 내부 행은 min-w-0 + overflow-hidden 으로 좁은 lg:col-span-4 안에서도
  // 잘리지 않고 wrap 되도록 보호 (사용자 보고 2026-05-12).
  return (
    <Card className={`${className} border-rule overflow-hidden`}>
      <CardContent className="p-5 h-full flex flex-col min-w-0">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-[11px] uppercase tracking-[0.12em] truncate">
            내 지역 교육청
          </span>
        </div>
        {region ? (
          <>
            <p className="mt-2.5 font-serif text-xl font-medium tracking-tight truncate">
              {region}
            </p>

            {recent.length > 0 ? (
              <div className="mt-3 min-w-0">
                <p className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  1차 합격선 추이
                </p>
                <ul className="mt-1.5 space-y-1">
                  {recent.map((c) => (
                    <li
                      key={c.year}
                      className="flex items-baseline justify-between gap-2 text-[12px] min-w-0"
                    >
                      <span className="text-muted-foreground tabular-nums shrink-0">
                        {c.year}
                      </span>
                      <span className="flex items-baseline gap-1.5 tabular-nums min-w-0 justify-end">
                        {c.firstRoundCutScore != null ? (
                          <>
                            <span className="font-serif text-[15px] font-medium">
                              {c.firstRoundCutScore.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              점
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {c.competitionRatio != null && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            · {c.competitionRatio.toFixed(2)}:1
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {!anyVerified && (
                  <p className="mt-2 text-[10px] text-warning leading-relaxed">
                    ※ 운영자 검수 대기 — 자동 추출 데이터.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-[11.5px] text-muted-foreground leading-relaxed">
                해당 지역의 공개 합격선 데이터가 시드되면 표시됩니다.
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-[12px] text-muted-foreground leading-relaxed">
            설정에서 지역 교육청을 등록하시면
            <br />1차 합격선 추이가 표시됩니다.
          </p>
        )}
        <p className="mt-auto pt-3 text-[10px] text-muted-foreground leading-snug">
          공개 자료만 표시. 합격 가능성·점수 예측 없음.
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
  // 값이 긴 문자열(예: 2002–2026)일 때도 KPI 카드 폭(좁은 뷰포트 ~140px) 안에
  // 자동 축소되도록 clamp + min-w-0 적용. 사용자 보고 2026-05-12.
  const isLongValue = typeof value === "string" && value.length > 4;
  return (
    <Card className="border-rule overflow-hidden">
      <CardContent className="p-4 min-w-0">
        <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground truncate">
          {label}
        </div>
        <div className="mt-2 flex items-baseline gap-1 min-w-0">
          <span
            className={`font-serif font-medium tabular-nums tracking-tight whitespace-nowrap ${
              accent ? "text-evergreen" : "text-foreground"
            } ${isLongValue ? "text-[clamp(18px,3.2vw,24px)]" : "text-[clamp(22px,3.6vw,30px)]"}`}
          >
            {value}
          </span>
          {unit && (
            <span className="text-[11.5px] text-muted-foreground shrink-0">
              {unit}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
