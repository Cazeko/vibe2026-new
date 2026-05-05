"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { UploadCard } from "@/components/feature/ocr/upload-card";
import { MistakeCardList } from "@/components/feature/mistake/mistake-card-list";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  normalizeSavedMistakes,
  type SavedMistake,
} from "@/lib/mistake/normalize";

export default function MistakesPage() {
  const [items, setItems] = useState<SavedMistake[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/mistakes")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "조회 실패");
        setItems(normalizeSavedMistakes(data.items ?? []));
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "알 수 없는 오류");
      })
      .finally(() => setLoaded(true));
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const verified = items.filter(
      (i) =>
        i.answerSource === "official" || i.answerSource === "crowd_verified",
    ).length;
    const aiEstimate = items.filter((i) => i.answerSource === "ai_estimate").length;
    const selfCorrected = items.filter(
      (i) => i.answerSource === "user_self_corrected",
    ).length;
    return { total, verified, aiEstimate, selfCorrected };
  }, [items]);

  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="오답 노트"
        subtitle="시험지 사진·PDF를 업로드하면 자동으로 오답 카드가 저장됩니다."
      />
      <div className="px-6 grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* 좌측: 업로드 + 통계 */}
        <div className="space-y-3">
          <UploadCard
            onComplete={(r) => {
              setItems((prev) => [...r.saved, ...prev]);
            }}
          />

          <Card className="border-rule">
            <CardContent className="p-5 space-y-2">
              <h2 className="font-serif text-lg font-medium tracking-tight">정답 검증 현황</h2>
              <ul className="space-y-1.5">
                <Stat
                  Icon={AlertCircle}
                  tone="bg-error/10 text-error"
                  label="전체 오답"
                  value={`${stats.total}장`}
                />
                <Stat
                  Icon={Clock}
                  tone="bg-warning/10 text-warning"
                  label="검증 필요 (AI 추정)"
                  value={`${stats.aiEstimate}장`}
                />
                <Stat
                  Icon={ShieldCheck}
                  tone="bg-evergreen/10 text-evergreen"
                  label="공식·크라우드 검증"
                  value={`${stats.verified}장`}
                />
                <Stat
                  Icon={ShieldCheck}
                  tone="bg-info/10 text-info"
                  label="내가 정정"
                  value={`${stats.selfCorrected}장`}
                />
              </ul>
              <p className="text-[10.5px] text-muted-foreground pt-1">
                ※ 4계층 출처 모델 (헌법 제30조의2).
              </p>
            </CardContent>
          </Card>

          <Card className="border-evergreen bg-evergreen/[0.06]">
            <CardContent className="p-5">
              <h2 className="font-serif text-lg font-medium tracking-tight">SRS 복습 시작</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">
                FSRS 간격 반복 알고리즘으로 오답 카드를 자동 일정으로 복습합니다.
              </p>
              <Button asChild size="sm" className="mt-3 w-full">
                <Link href="/study/review">오답 복습 시작</Link>
              </Button>
            </CardContent>
          </Card>

          {loadError && (
            <p role="alert" className="text-sm text-destructive">
              기존 오답 카드를 불러오지 못했습니다: {loadError}
            </p>
          )}
        </div>

        {/* 우측: 카드 리스트 */}
        <div className="xl:col-span-2">
          {loaded && items.length === 0 ? (
            <Card className="border-rule h-full">
              <CardContent className="grid place-items-center h-full p-12 text-center">
                <AlertCircle
                  className="h-10 w-10 text-muted-foreground/60"
                  aria-hidden
                />
                <p className="mt-3 font-serif text-lg font-medium">아직 오답 카드가 없어요</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  좌측에서 시험지 사진·PDF를 업로드하면
                  <br />
                  AI가 자동으로 오답 카드를 추출합니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            <MistakeCardList
              items={items}
              onUpdated={(id, updated) =>
                setItems((prev) =>
                  prev.map((p) => (p.id === id ? { ...p, ...updated } : p)),
                )
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  Icon,
  tone,
  label,
  value,
}: {
  Icon: typeof AlertCircle;
  tone: string;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center gap-2.5 rounded-lg border border-rule bg-background px-2.5 py-2">
      <span aria-hidden className={`grid h-7 w-7 place-items-center rounded-md ${tone}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="flex-1">
        <p className="text-[10.5px] text-muted-foreground">{label}</p>
        <p className="text-[13px] font-semibold leading-tight">{value}</p>
      </div>
    </li>
  );
}
