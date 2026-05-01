import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { clamp } from "@/lib/utils";

type FitGaugeProps = {
  value: number;
  university?: string;
};

export function FitGauge({ value, university }: FitGaugeProps) {
  const safe = clamp(value, 0, 100);
  return (
    <Card>
      <CardHeader>
        <CardTitle>학습 적합도</CardTitle>
        <p className="text-xs text-muted-foreground">
          {university ?? "학교를 선택하세요"}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-4xl font-bold tabular-nums">{safe}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        <Progress value={safe} aria-label="학습 적합도" />
        <p className="text-xs text-muted-foreground">
          참고용 지표이며, 합격을 보장하지 않습니다.
        </p>
      </CardContent>
    </Card>
  );
}
