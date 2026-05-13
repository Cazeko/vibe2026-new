import Link from "next/link";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getRoadmap, type RoadmapEntry } from "@/lib/exam-analysis/queries";
import { EmptySeedNotice } from "./empty-seed-notice";

// 헌법 v3.5 제13조의2·제3조의2 정합 — 영역별 S/A/B/C 학습 우선순위 자동 분배.
// 합격 컷·확률·점수 예측은 일체 표시하지 아니한다. 출제 빈도 + 최근 5년 가중치만.
// v3.7 외부 평가 #4.14 — 정렬 가능 헤더 (URL searchParams 기반 server 정렬).

type SortKey = "grade" | "domain" | "itemCount" | "recency";
type SortDir = "asc" | "desc";

const GRADE_ORDER: Record<RoadmapEntry["grade"], number> = {
  S: 0,
  A: 1,
  B: 2,
  C: 3,
};

function sortRows(
  rows: RoadmapEntry[],
  key: SortKey,
  dir: SortDir,
): RoadmapEntry[] {
  const sign = dir === "asc" ? 1 : -1;
  const copy = [...rows];
  copy.sort((a, b) => {
    if (key === "grade") return sign * (GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade]);
    if (key === "domain") return sign * a.domain.localeCompare(b.domain, "ko");
    if (key === "itemCount") return sign * (a.itemCount - b.itemCount);
    if (key === "recency") return sign * (a.recencyScore - b.recencyScore);
    return 0;
  });
  return copy;
}

function nextDir(active: boolean, dir: SortDir): SortDir {
  if (!active) return "asc";
  return dir === "asc" ? "desc" : "asc";
}

function SortableTh({
  label,
  field,
  current,
  dir,
  align,
}: {
  label: string;
  field: SortKey;
  current: SortKey;
  dir: SortDir;
  align?: "left" | "right";
}) {
  const active = field === current;
  const targetDir = nextDir(active, dir);
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  const params = new URLSearchParams({
    tab: "roadmap",
    sort: field,
    dir: targetDir,
  });
  return (
    <Link
      href={`/exam-analysis?${params.toString()}`}
      scroll={false}
      prefetch={false}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
        active ? "text-foreground" : ""
      } ${align === "right" ? "ml-auto" : ""}`}
    >
      {label}
      <Icon className="h-3 w-3 opacity-70" aria-hidden />
    </Link>
  );
}

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
    // Track 2.2 — 24px 큰 카드 숫자에서 text-warning(#c9a55b, 2.16:1)은
    // WCAG large text 3:1도 미달. warning-text 토큰 (5.1:1) 으로 정합.
    tone: "text-warning-text",
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

export async function RoadmapTab({
  sortKey = "grade",
  sortDir = "asc",
}: {
  sortKey?: SortKey;
  sortDir?: SortDir;
} = {}) {
  const raw = await getRoadmap();
  const roadmap = sortRows(raw, sortKey, sortDir);

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

      {/* 영역별 상세
          v3.6 외부 평가 #4.15 — sticky thead. 긴 표 스크롤 시 헤더 고정.
          parent (CardContent p-0) 가 scroll 컨테이너가 아니므로 thead top-0
          sticky 는 viewport 기준 동작. 페이지 스크롤에서도 표 헤더 유지. */}
      <Card className="border-rule overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-secondary/80 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground shadow-[0_1px_0_0_hsl(var(--color-rule))]">
              <tr>
                <th className="text-left px-5 py-2.5 w-16">
                  <SortableTh
                    label="등급"
                    field="grade"
                    current={sortKey}
                    dir={sortDir}
                  />
                </th>
                <th className="text-left px-5 py-2.5">
                  <SortableTh
                    label="영역"
                    field="domain"
                    current={sortKey}
                    dir={sortDir}
                  />
                </th>
                <th className="text-right px-5 py-2.5 tabular-nums w-20">
                  <SortableTh
                    label="누적 문항"
                    field="itemCount"
                    current={sortKey}
                    dir={sortDir}
                    align="right"
                  />
                </th>
                <th className="text-right px-5 py-2.5 tabular-nums w-20">
                  <SortableTh
                    label="최근 5년"
                    field="recency"
                    current={sortKey}
                    dir={sortDir}
                    align="right"
                  />
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
