import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { RECENT_FILES } from "@/lib/data/demo-persona";

// 헌법 v1.9 제13조 3번 — 자료 관리 (디자인 stub).
// 백엔드 연동(업로드 → OCR → 시카드 변환 파이프라인)은 후속 작업.
export default function MaterialsPage() {
  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="자료 관리"
        subtitle="기출·교재 PDF를 업로드하면 자동으로 시카드로 변환됩니다."
      />
      <div className="px-8 space-y-5">
        <Card className="rounded-2xl border-0 shadow-sm border-dashed border-2 border-border/60">
          <CardContent className="grid place-items-center p-12 text-center text-sm text-muted-foreground">
            업로드 영역 — 백엔드 연동은 D19 예정
          </CardContent>
        </Card>

        <section>
          <h2 className="mb-3 text-base font-bold">최근 학습 자료</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {RECENT_FILES.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-2xl border-0 bg-card px-4 py-3 shadow-sm"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-500">
                  <FileText className="h-4 w-4" aria-hidden />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-[11px] text-muted-foreground">{f.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-[11px] text-muted-foreground">
          시연용 파일 목록입니다 (헌법 v1.9 제16조의2 정신).
        </p>
      </div>
    </div>
  );
}
