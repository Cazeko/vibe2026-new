import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq, or, sql } from "drizzle-orm";
import {
  Mic,
  Headphones,
  Sparkles,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { podcastEpisodes } from "@/lib/db/schema";
import { safeRun } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

// 헌법 v3.0 제13조의3 — NotebookLM 스타일 자동 생성 팟캐스트.
// 헌법 제36조 우선순위 5 — 첫 가치 마법 지점 2 (TTS 통합 어려우면 Phase 2 보류).
// 본 페이지는 시드 미적재 + TTS 미통합 시점의 셸. Gemini multi-speaker TTS
// 통합 후 자동 생성 + 사용자 즉석 생성 동선 활성화 (제18조 1항 A 매트릭스).

function fmtDuration(sec: number | null): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}분 ${String(s).padStart(2, "0")}초`;
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function PodcastPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const episodes = await safeRun(
    "podcast episodes",
    async () => {
      const db = getDb();
      return db
        .select()
        .from(podcastEpisodes)
        .where(
          or(
            eq(podcastEpisodes.scope, "shared"),
            eq(podcastEpisodes.userId, user.id),
          ),
        )
        .orderBy(desc(podcastEpisodes.generatedAt))
        .limit(40);
    },
    [] as (typeof podcastEpisodes.$inferSelect)[],
  );

  const stats = await safeRun(
    "podcast stats",
    async () => {
      const db = getDb();
      const [row] = await db
        .select({
          total: sql<number>`count(*)::int`,
          sharedCount: sql<number>`count(*) filter (where ${podcastEpisodes.scope} = 'shared')::int`,
          userCount: sql<number>`count(*) filter (where ${podcastEpisodes.scope} = 'user' and ${podcastEpisodes.userId} = ${user.id})::int`,
          totalDuration: sql<number>`coalesce(sum(${podcastEpisodes.durationSec}), 0)::int`,
        })
        .from(podcastEpisodes);
      return (
        row ?? { total: 0, sharedCount: 0, userCount: 0, totalDuration: 0 }
      );
    },
    { total: 0, sharedCount: 0, userCount: 0, totalDuration: 0 },
  );

  const empty = (stats?.total ?? 0) === 0;

  const sharedEpisodes = episodes.filter((e) => e.scope === "shared");
  const userEpisodes = episodes.filter((e) => e.scope === "user");

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="팟캐스트"
        subtitle="2인 화자 대화체 팟캐스트로 자동 생성된 학습 청취 — 이동 중에도 학습."
      />

      <div className="px-6 mx-auto max-w-7xl space-y-8">
        {/* KPI 줄 */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="공유 에피소드"
            value={stats?.sharedCount ?? 0}
            unit="개"
          />
          <StatCard
            label="내 에피소드"
            value={stats?.userCount ?? 0}
            unit="개"
          />
          <StatCard
            label="총 청취 가능"
            value={fmtDuration(stats?.totalDuration ?? 0)}
            unit=""
          />
          <StatCard
            label="음성 합성"
            value={empty ? "대기" : "활성"}
            unit=""
            accent={!empty}
          />
        </section>

        <SectionRule />

        {/* 음성 합성 통합 안내 (시드 + TTS 미통합 시점) */}
        {empty && (
          <Card className="border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30">
            <CardContent className="p-6 flex gap-3">
              <ShieldAlert
                className="h-5 w-5 text-warning shrink-0 mt-0.5"
                aria-hidden
              />
              <div className="text-[13px] text-foreground/85 leading-relaxed">
                <p className="font-serif text-base font-medium text-foreground">
                  음성 합성 통합 후 활성화됩니다
                </p>
                <p className="mt-1.5">
                  팟캐스트는 2인 화자 대화체로 자동 생성됩니다. 음성 합성
                  서비스 가용성 변동 시 단일 화자 또는 외부 임베드로 우회할 수
                  있습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 즉석 생성 진입점 (사용자 약점 기반) */}
        <Card className="border-evergreen bg-evergreen/[0.04]">
          <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="grid h-8 w-8 place-items-center rounded-full bg-evergreen text-primary-foreground font-serif italic font-medium text-sm"
              >
                F
              </span>
              <div>
                <p className="font-serif text-lg font-medium tracking-tight">
                  내 약점 영역 즉석 청취
                </p>
                <p className="mt-1 text-[12.5px] text-muted-foreground leading-relaxed max-w-lg">
                  학습 분석에서 추출한 약점 영역·연도·주제를 선택하시면 2인 화자
                  대화체 5~10분 청취 학습이 즉석 생성됩니다.
                </p>
              </div>
            </div>
            <Button disabled={empty} className="shrink-0">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {empty ? "음성 합성 통합 후 활성화" : "즉석 생성"}
            </Button>
          </CardContent>
        </Card>

        {/* 공유 에피소드 (시드) */}
        <section className="space-y-4">
          <SectionHeader
            icon={Headphones}
            title="공유 에피소드"
            subtitle="시드 영역×연도·주제 단위 자동 생성 — 모든 사용자가 동일하게 청취"
          />
          <EpisodeGrid
            episodes={sharedEpisodes.map((e) => ({
              id: e.id,
              theme: e.theme,
              durationSec: e.durationSec,
              verified: e.verified,
              generatedAt: e.generatedAt.toISOString(),
            }))}
            emptyHint="공유 에피소드가 시드되면 영역×연도 자동 큐레이션이 표시됩니다"
          />
        </section>

        <SectionRule />

        {/* 내 즉석 에피소드 */}
        <section className="space-y-4">
          <SectionHeader
            icon={Mic}
            title="내 즉석 에피소드"
            subtitle="본인 약점 영역·자료 기반 즉석 생성 — 본인만 청취"
          />
          <EpisodeGrid
            episodes={userEpisodes.map((e) => ({
              id: e.id,
              theme: e.theme,
              durationSec: e.durationSec,
              verified: e.verified,
              generatedAt: e.generatedAt.toISOString(),
            }))}
            emptyHint="즉석 생성 후 본 자리에 누적됩니다 — 시드된 에피소드와 함께 청취 가능"
          />
        </section>
      </div>
    </div>
  );
}

// --- presentation parts ----------------------------------------------------

function SectionRule() {
  return <div className="h-px bg-rule" aria-hidden />;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Headphones;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 flex-wrap">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-evergreen" aria-hidden />
          <h2 className="font-serif text-xl font-medium tracking-tight">
            {title}
          </h2>
        </div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
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

type EpisodeRow = {
  id: string;
  theme: string;
  durationSec: number | null;
  verified: boolean;
  generatedAt: string;
};

function EpisodeGrid({
  episodes,
  emptyHint,
}: {
  episodes: EpisodeRow[];
  emptyHint: string;
}) {
  if (episodes.length === 0) {
    return (
      <Card className="border-rule border-dashed">
        <CardContent className="p-8 text-center">
          <Headphones
            className="h-5 w-5 mx-auto text-muted-foreground"
            aria-hidden
          />
          <p className="mt-2 text-[12.5px] text-muted-foreground leading-relaxed max-w-md mx-auto">
            {emptyHint}
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {episodes.map((e) => (
        <li key={e.id}>
          <Link href={`/podcast/${e.id}`} className="block group">
            <Card className="border-rule transition-colors group-hover:border-rule-strong h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  <span>
                    {relativeDate(e.generatedAt)}
                  </span>
                  {e.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-1.5 py-0.5 text-info">
                      검증됨
                    </span>
                  )}
                </div>
                <p className="mt-2 font-serif text-base font-medium tracking-tight line-clamp-2">
                  {e.theme}
                </p>
                <div className="mt-auto pt-4 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                  <Clock className="h-3 w-3" aria-hidden />
                  <span className="tabular-nums">
                    {fmtDuration(e.durationSec)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
