import Link from "next/link";
import { ChevronRight, FileText, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getPaperList, type PaperRow } from "@/lib/exam-analysis/queries";
import { getSessionLabel } from "@/lib/exam/sessions";
import { EmptySeedNotice } from "./empty-seed-notice";

// 헌법 v3.5 제13조의2·제18조의3 정합 — 학년도별 시험지 목록.
// 객관식 시대(2002~2013)는 풀이 출제 X 이지만 분석에는 함께 표시된다.

export async function PapersTab() {
  const papers = await getPaperList();

  if (papers.length === 0) {
    return (
      <EmptySeedNotice tabHint="2002~2026학년도 24회분 시험지 메타(연도·구분·검증 상태)" />
    );
  }

  // 학년도별 그룹 (essay/A/B/combined가 같은 학년도에 함께 묶인다)
  const byYear = new Map<number, PaperRow[]>();
  for (const p of papers) {
    if (!byYear.has(p.year)) byYear.set(p.year, []);
    byYear.get(p.year)!.push(p);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  // 객관식 시대 분리 라벨링 (서술/논술 도입 = 2014학년도)
  const oldEra = years.filter((y) => y <= 2013);
  const newEra = years.filter((y) => y > 2013);

  return (
    <div className="space-y-8">
      {newEra.length > 0 && (
        <YearGroup
          title="서술/논술 시대 (2014학년도~)"
          subtitle="풀이 트랙 + 키워드 트랙 + 분석 모두 활성"
          years={newEra}
          byYear={byYear}
        />
      )}
      {oldEra.length > 0 && (
        <YearGroup
          title="객관식 시대 (2002~2013학년도)"
          subtitle="풀이 출제 X · 키워드 트랙·분석으로 흡수"
          years={oldEra}
          byYear={byYear}
          dimmed
        />
      )}
    </div>
  );
}

function YearGroup({
  title,
  subtitle,
  years,
  byYear,
  dimmed = false,
}: {
  title: string;
  subtitle: string;
  years: number[];
  byYear: Map<number, PaperRow[]>;
  dimmed?: boolean;
}) {
  return (
    <section className="space-y-3">
      <header>
        <h3 className="font-serif text-base font-medium tracking-tight">
          {title}
        </h3>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">{subtitle}</p>
      </header>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {years.map((year) => {
          const sessions = byYear.get(year)!;
          return (
            <li key={year}>
              <YearCard year={year} sessions={sessions} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function YearCard({ year, sessions }: { year: number; sessions: PaperRow[] }) {
  const totalItems = sessions.reduce((s, p) => s + p.itemCount, 0);
  const totalPoints = sessions.reduce((s, p) => s + p.totalPoints, 0);
  const allTextVerified = sessions.every(
    (p) => p.verifiedTextCount === p.itemCount && p.itemCount > 0,
  );

  return (
    <Card className="border-rule transition-colors hover:border-rule-strong">
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-2xl font-medium tracking-tight tabular-nums">
            {year}
          </span>
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
            학년도
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <Stat label="구분" value={`${sessions.length}`} unit="회" />
          <Stat label="문항" value={`${totalItems}`} unit="개" />
          <Stat label="총점" value={`${totalPoints}`} unit="점" />
        </div>

        <ul className="space-y-1 border-t border-rule pt-2.5">
          {sessions.map((p) => (
            <li key={p.id}>
              <Link
                href={`/exam-analysis/papers/${p.id}`}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 -mx-2 text-[12px] hover:bg-secondary/50"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <FileText
                    className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                    aria-hidden
                  />
                  <span className="truncate">{getSessionLabel(p.session)}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0 text-muted-foreground">
                  <span className="tabular-nums text-[11px]">
                    {p.itemCount}문항
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 pt-1">
          {allTextVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-1.5 py-0.5 text-[10px] text-info">
              <ShieldCheck className="h-2.5 w-2.5" />
              본문 검증
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">
              <AlertCircle className="h-2.5 w-2.5" />
              일부 미검증
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div>
      <div className="text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-0.5">
        <span className="font-serif text-base font-medium tabular-nums">
          {value}
        </span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
