import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DEMO_KPI } from "@/lib/data/demo-persona";

// 헌법 v1.9 제13조 — KPI 4 카드. 헌법 제16조의2 (정직 모드) 라벨은 페이지 푸터에서 일괄 노출.
export function KpiCards() {
  return (
    <section
      aria-label="핵심 지표"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="space-y-3 p-5">
          <p className="text-xs text-muted-foreground">목표 대학</p>
          <p className="text-xl font-bold">{DEMO_KPI.targetUniversity}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">적합도</span>
              <span className="font-semibold text-primary">
                {DEMO_KPI.fitProgressPercent}%
              </span>
            </div>
            <Progress value={DEMO_KPI.fitProgressPercent} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="space-y-3 p-5">
          <p className="text-xs text-muted-foreground">나의 Fit 점수</p>
          <p className="text-3xl font-bold tracking-tight">
            <span className="text-primary">{DEMO_KPI.fitScore}</span>
            <span className="ml-1 text-base font-medium text-muted-foreground">
              /100
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            상위 {DEMO_KPI.fitPercentile}%
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="space-y-3 p-5">
          <p className="text-xs text-muted-foreground">누적 학습 시간</p>
          <p className="text-3xl font-bold tracking-tight">
            <span>{Math.floor(DEMO_KPI.studyMinutes / 60)}</span>
            <span className="ml-1 text-base font-medium text-muted-foreground">
              시간
            </span>
            <span className="ml-2">{DEMO_KPI.studyMinutes % 60}</span>
            <span className="ml-1 text-base font-medium text-muted-foreground">
              분
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            이번 주 +{Math.floor(DEMO_KPI.studyDeltaMinutes / 60)}시간{" "}
            {DEMO_KPI.studyDeltaMinutes % 60}분
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="space-y-3 p-5">
          <p className="text-xs text-muted-foreground">연속 학습</p>
          <p className="text-3xl font-bold tracking-tight">
            <span>{DEMO_KPI.streakDays}</span>
            <span className="ml-1 text-base font-medium text-muted-foreground">
              일
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            최고 기록 {DEMO_KPI.streakBest}일
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
