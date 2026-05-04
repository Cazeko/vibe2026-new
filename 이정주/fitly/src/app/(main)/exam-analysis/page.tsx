import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

// 헌법 v1.9 제13조 4번 — 기출 분석 (디자인 stub).
export default function ExamAnalysisPage() {
  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="기출 분석"
        subtitle="학교별·연도별 출제 패턴을 데이터로 가시화합니다."
      />
      <div className="px-8">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="grid place-items-center p-16 text-center text-sm text-muted-foreground">
            기출 분석 위젯은 한양대 5년치 50건 수집 완료 후 활성화됩니다 (헌법
            v1.9 제11조 단서).
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
