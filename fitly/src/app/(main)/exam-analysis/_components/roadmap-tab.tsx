import { Card, CardContent } from "@/components/ui/card";
import { getRoadmap, type RoadmapEntry } from "@/lib/exam-analysis/queries";
import { EmptySeedNotice } from "./empty-seed-notice";

// 헌법 v3.5 제13조의2·제3조의2 정합 — 영역별 S/A/B/C 학습 우선순위 자동 분배.
// 합격 컷·확률·점수 예측은 일체 표시하지 아니한다. 출제 빈도 + 최근 5년 가중치만.

const GRADE_META: Record<
  RoadmapEntry["grade"],
  { label: string; tone: string; toneSoft: string; rule: string }
> = {
  S: {
    label: "최우선 회독",
    tone: "text-evergreen",
    toneSoft: "bg-evergreen/10",
    rule: "border-evergreen/40",
  },
  A: {
    label: "주 2회 회독",
    tone: "text-info",
    toneSoft: "bg-info/10",
    rule: "border-info/40",
  },
  B: {
    label: "주 1회 회독",
    tone: "text-warning",
    toneSoft: "bg-warning/10",
    rule: "border-warning/40",
  },
  C: {
    label: "여유 시 회독",
    tone: "text-muted-foreground",
    toneSoft: "bg-rule/40",
    rule: "border-rule",
  },
};

export async function RoadmapTab() {
  const roadmap = await getRoadmap();

  if (roadmap.length === 0) {
    return (
      <div className="space-y-4">
        <EmptySeedNotice tabHint="S/A/B/C 4 등급 영역별 학습 우선순위 자동 분배" />
        <PreviewGrades />
      </div>
    );
  }

  // 그룹핑
  const grouped = (["S", "A", "B", "C"] as const).map((g) => ({
    grade: g,
    items: roadmap.filter((r) => r.grade === g),
  }));

  const total = roadmap.length;

  return (
    <div className="space-y-5">
      {/* 등급 요약 */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {grouped.map(({ grade, items }) => {
          const meta = GRADE_META[grade];
          const pct = total > 0 ? Math.round((items.length / total) * 100) : 0;
          return (
            <Card
              key={grade}
              className={`border ${meta.rule}`}
            >
              <CardContent className="p-4">
                <div className="flex items-baseline justify-between">
                  <span
                    className={`font-serif text-2xl font-medium tracking-tight tabular-nums ${meta.tone}`}
                  >
                    {grade}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {meta.label}
                  </span>
                </div>
                <p className="mt-2 text-[11.5px] text-muted-foreground tabular-nums">
                  영역 <span className="text-foreground font-medium">{items.length}</span>개{" "}
                  ({pct}%)
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* 영역별 상세 */}
      <Card className="border-rule">
        <CardContent className="p-0">
          <table className="w-full text-[12.5px]">
            <thead className="bg-surface-deep/40 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-2.5 w-16">등급</th>
                <th className="text-left px-5 py-2.5">영역</th>
                <th className="text-right px-5 py-2.5 tabular-nums w-20">
                  누적 문항
                </th>
                <th className="text-right px-5 py-2.5 tabular-nums w-20">
                  최근 5년
                </th>
                <th className="text-left px-5 py-2.5">학습 권장</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {roadmap.map((r) => {
                const meta = GRADE_META[r.grade];
                return (
                  <tr key={r.domain}>
                    <td className="px-5 py-2.5">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded ${meta.toneSoft} ${meta.tone} font-serif text-sm font-medium`}
                      >
                        {r.grade}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 font-medium">{r.domain}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">
                      {r.itemCount}문항
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">
                      {Math.round(r.recencyScore * 100)}%
                    </td>
                    <td className="px-5 py-2.5 text-muted-foreground">
                      {r.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-[10.5px] text-muted-foreground leading-relaxed">
        등급은 누적 출제 빈도(60%) + 최근 5년 가중치(40%)로 자동 산출됩니다.{" "}
        <strong>합격 컷·확률·점수 예측은 일체 포함되지 않습니다.</strong>
      </p>
    </div>
  );
}

function PreviewGrades() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {(["S", "A", "B", "C"] as const).map((g) => {
        const meta = GRADE_META[g];
        return (
          <Card key={g} className={`border ${meta.rule}`}>
            <CardContent className="p-4">
              <div className="flex items-baseline justify-between">
                <span
                  className={`font-serif text-2xl font-medium tracking-tight ${meta.tone}`}
                >
                  {g}
                </span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {meta.label}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">—</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
