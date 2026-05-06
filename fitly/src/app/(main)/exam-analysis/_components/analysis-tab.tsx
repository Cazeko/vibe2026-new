import { Card, CardContent } from "@/components/ui/card";
import {
  getDomainHeatmap,
  getBloomHeatmap,
  getFormatHeatmap,
} from "@/lib/exam-analysis/queries";
import { ExamHeatmap } from "./exam-heatmap";
import { EmptySeedNotice } from "./empty-seed-notice";

// 헌법 v3.5 제13조의2 정합 — 영역×학년도 / Bloom×학년도 / 형식×학년도 히트맵 3종.
// 단일 색(info navy) 명도 단계로만 표현 — DESIGN.md §4.3 evergreen 보호 + §4.4 차분한 채도.

export async function AnalysisTab() {
  const [domain, bloom, format] = await Promise.all([
    getDomainHeatmap(),
    getBloomHeatmap(),
    getFormatHeatmap(),
  ]);

  const allEmpty =
    domain.rows.length === 0 &&
    bloom.rows.length === 0 &&
    format.rows.length === 0;

  if (allEmpty) {
    return (
      <EmptySeedNotice tabHint="영역×학년도 / 인지수준×학년도 / 문항형식×학년도 히트맵 3종" />
    );
  }

  return (
    <div className="space-y-5">
      <HeatmapSection
        title="영역 × 학년도"
        subtitle="11과목 + 교육학 — 학년도별 출제 빈도"
        meta="11과목"
        matrix={domain}
        tone="info"
      />
      <HeatmapSection
        title="인지수준 × 학년도"
        subtitle="기억·이해·적용·분석·평가·창작 — 6단계 사고 수준"
        meta="6단계"
        matrix={bloom}
        tone="info"
      />
      <HeatmapSection
        title="문항형식 × 학년도"
        subtitle="객관식·단답형·서술형·논술형"
        meta="4종"
        matrix={format}
        tone="warning"
      />
    </div>
  );
}

function HeatmapSection({
  title,
  subtitle,
  meta,
  matrix,
  tone,
}: {
  title: string;
  subtitle: string;
  meta: string;
  matrix: Parameters<typeof ExamHeatmap>[0]["matrix"];
  tone: "info" | "warning";
}) {
  return (
    <Card className="border-rule">
      <CardContent className="p-5">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-serif text-lg font-medium tracking-tight">
              {title}
            </h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
            {meta}
          </div>
        </div>
        <div className="mt-4">
          <ExamHeatmap matrix={matrix} tone={tone} />
        </div>
      </CardContent>
    </Card>
  );
}
