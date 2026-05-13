import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import {
  Calendar,
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
        {/* 백승환 피드백 #9 (2026-05-13) — KPI 와 RegionCard 가 한 grid row 에
            5 items 로 배치되어 lg(1024px)에서 RegionCard col-span-4 폭이 너무
            좁아 정보가 답답하게 잘리던 문제. 두 section 으로 분리하여 각자
            자연스러운 폭 확보 + sm/md/lg/xl 각 breakpoint 균형 정합. */}
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

        {/* RegionCard 별도 section — lg+ 에서는 max-w-md (≈28rem) 로 제한하여
            합격선 추이 표시 영역이 답답해지지 않고 우측 여백 자연스럽게 정합. */}
        <section className="lg:max-w-md">
          <RegionCard region={targetRegion} cutScores={cutScores} />
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
// HonestyCard, SectionRule 제거 — 사용자 요청 2026-05-12 (자리를 KPI 가 대체).
// 정직성 원칙 본문은 페이지 하단 disclaimer + 각 stat 의 사실 데이터 자체로 노출됨.

function RegionCard({
  region,
  cutScores,
}: {
  region: string | null;
  cutScores: CutScoreRow[];
}) {
  const className = ""; // 부모 section 에서 폭 제한 — 본 컴포넌트는 자기 폭 100% 차지.
  // 학년도 내림차순으로 최대 3개만 표시
  const recent = cutScores.slice(0, 3);
  const anyVerified = cutScores.some((c) => c.verified);

  // 내부 행은 min-w-0 + overflow-hidden 으로 좁은 lg:col-span-4 안에서도
  // 잘리지 않고 wrap 되도록 보호 (사용자 보고 2026-05-12).
  return (
    <Card className={`${className} border-rule overflow-hidden`}>
      <CardContent className="px-3 py-2.5 h-full flex flex-col min-w-0">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="text-[10px] uppercase tracking-[0.12em] truncate">
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
                  <p className="mt-2 text-[10px] text-warning-text leading-relaxed">
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
  className = "",
}: {
  label: string;
  value: string | number;
  unit: string;
  accent?: boolean;
  className?: string;
}) {
  // 값이 긴 문자열(예: 2002–2026)일 때도 KPI 카드 폭(좁은 뷰포트 ~140px) 안에
  // 자동 축소되도록 clamp + min-w-0 적용. 사용자 보고 2026-05-12.
  // 추가 보고 2026-05-12 — padding/폰트/spacing 일괄 컴팩트화 (여백 과다).
  const isLongValue = typeof value === "string" && value.length > 4;
  return (
    <Card className={`border-rule overflow-hidden ${className}`}>
      <CardContent className="px-3 py-2.5 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground truncate">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-1 min-w-0">
          <span
            className={`font-serif font-medium tabular-nums tracking-tight whitespace-nowrap leading-none ${
              accent ? "text-evergreen" : "text-foreground"
            } ${isLongValue ? "text-[clamp(15px,2.6vw,20px)]" : "text-[clamp(18px,3vw,24px)]"}`}
          >
            {value}
          </span>
          {unit && (
            <span className="text-[10.5px] text-muted-foreground shrink-0">
              {unit}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
