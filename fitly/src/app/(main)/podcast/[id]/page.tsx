import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { podcastEpisodes, podcastProgress } from "@/lib/db/schema";
import type { PodcastScript } from "@/lib/podcast/script";
import { AudioPlayer } from "./_components/audio-player";

// 헌법 §3.2 정직성 — verified=false면 "AI 생성, 공식 해설이 아님" 안내 명시 (§8.4 좌측 3px 패턴).
// 권한 — shared = 모두, user scope = 본인만.

export const dynamic = "force-dynamic";

export default async function PodcastEpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = getDb();
  const [ep] = await db
    .select()
    .from(podcastEpisodes)
    .where(eq(podcastEpisodes.id, id))
    .limit(1);
  if (!ep) return notFound();
  if (ep.scope === "user" && ep.userId !== user.id) {
    return notFound();
  }

  const [prog] = await db
    .select()
    .from(podcastProgress)
    .where(
      and(
        eq(podcastProgress.userId, user.id),
        eq(podcastProgress.episodeId, id),
      ),
    )
    .limit(1);

  const script = ep.scriptJson as PodcastScript | null;
  const generatedAt = ep.generatedAt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen pb-12">
      <PageHeader title={ep.theme} subtitle={`생성일: ${generatedAt}`} />
      <div className="px-6 mx-auto max-w-3xl space-y-5">
        <Link
          href="/podcast"
          className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          팟캐스트 목록으로
        </Link>

        {!ep.verified && (
          <Card className="border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30">
            <CardContent className="p-4 flex gap-2.5">
              <ShieldAlert
                className="h-4 w-4 text-warning shrink-0 mt-0.5"
                aria-hidden
              />
              <p className="text-[12.5px] text-foreground/85 leading-relaxed">
                AI가 생성한 학습 보조 자료입니다. 공식 해설이 아니며, 학습 결정
                시 참고 자료로 활용해 주세요.
              </p>
            </CardContent>
          </Card>
        )}

        {ep.audioUrl ? (
          <AudioPlayer
            episodeId={ep.id}
            audioUrl={ep.audioUrl}
            durationSec={ep.durationSec}
            initialCurrentSec={prog?.currentSec ?? 0}
            initialCompleted={!!prog?.completedAt}
          />
        ) : (
          <Card className="border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30">
            <CardContent className="p-4 text-[12.5px] text-foreground/85">
              오디오 파일이 아직 업로드되지 않았습니다. 잠시 후 새로고침해 주세요.
            </CardContent>
          </Card>
        )}

        {script && (
          <section className="space-y-3">
            <h2 className="font-serif text-lg font-medium tracking-tight">
              스크립트
            </h2>
            <Card className="border-rule">
              <CardContent className="p-5 space-y-2.5">
                {script.dialogue.map((line, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span
                      className={`shrink-0 w-12 text-[11px] font-medium tabular-nums ${
                        line.speaker === script.speakers[0]
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {line.speaker}
                    </span>
                    <p className="text-[13px] leading-[1.7] text-foreground/85">
                      {line.text}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
            {script.summary && (
              <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                요약: {script.summary}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
