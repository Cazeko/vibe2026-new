import Link from "next/link";
import { ChevronRight, FileText, ShieldCheck, AlertCircle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getPaperList, type PaperRow } from "@/lib/exam-analysis/queries";
import { getSessionLabel } from "@/lib/exam/sessions";
import { EmptySeedNotice } from "./empty-seed-notice";

// 헌법 v3.5 제13조의2·제18조의3 정합 — 학년도별 시험지 목록.
// 객관식 시대(2002~2013)는 풀이 출제 X 이지만 분석에는 함께 표시된다.
// 사용자 보고 2026-05-12 정합: 시대 라벨은 실제 DB 데이터 기반 동적 산출.

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

  // 시대 구분 (서술/논술 도입 = 2014학년도)
  const oldEra = years.filter((y) => y <= 2013);
  const newEra = years.filter((y) => y > 2013);

  // 라벨은 실제 데이터 기반 동적 산출 (DB seed 와 헌법 명문 사이 불일치 방지).
  // 단일 학년도일 때는 범위 표기 대신 단일 학년도로 축약.
  const newEraLabel = formatEraLabel("서술/논술 시대", newEra);
  const oldEraLabel = formatEraLabel("객관식 시대", oldEra);

  // 헌법 제18조의3 5항 — 2001학년도 이전 PDF 폰트 손상으로 시드 제외 명시.
  // DB에 2001이 시드된 경우 사용자에게 사유를 안내.
  const hasPre2002 = oldEra.some((y) => y < 2002);

  return (
    <div className="space-y-8">
      {newEra.length > 0 && (
        <YearGroup
          title={newEraLabel}
          subtitle="풀이 트랙 + 키워드 트랙 + 분석 모두 활성"
          years={newEra}
          byYear={byYear}
        />
      )}
      {oldEra.length > 0 && (
        <YearGroup
          title={oldEraLabel}
          subtitle="풀이 출제 X · 키워드 트랙·분석으로 흡수"
          years={oldEra}
          byYear={byYear}
        />
      )}

      {/* 누락 학년도 안내 (헌법 v3.5 제18조의3 5항 정합) */}
      <aside className="rounded-md border border-rule bg-secondary/20 px-4 py-3 flex items-start gap-2.5">
        <Info
          className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5"
          aria-hidden
        />
        <div className="text-[11.5px] text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground/85">목록에 보이지 않는 학년도</strong>는
            공식 시험지 PDF 가 시드되지 않았거나 일부 폰트 손상으로
            제외된 학년도입니다.
          </p>
          {hasPre2002 && (
            <p className="mt-1">
              · 2001학년도 이전 자료는 폰트 손상으로 일부만 시드됩니다 (헌법
              제18조의3 5항).
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function YearGroup({
  title,
  subtitle,
  years,
  byYear,
}: {
  title: string;
  subtitle: string;
  years: number[];
  byYear: Map<number, PaperRow[]>;
}) {
  return (
    <section className="space-y-3">
      <header>
        <h3 className="font-serif text-base font-medium tracking-tight">
          {title}
        </h3>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">{subtitle}</p>
      </header>
      {/* xl:grid-cols-4 → xl:grid-cols-3 으로 카드 너비 확보 (사용자 보고 2026-05-12) */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

  // 카드 클릭가능성 강화 — 보더 강조 + shadow 만으로 cue. evergreen 은
  // DESIGN.md §4.3 5곳 액센트(Progress·CTA·델타·활성 메뉴·AI 추천)에 한해
  // 사용해야 하므로 단순 hover 상태에는 적용하지 아니한다.
  return (
    <Card className="border-rule transition-all hover:border-rule-strong hover:shadow-sm overflow-hidden">
      <CardContent className="p-5 flex flex-col gap-3 min-w-0">
        <div className="flex items-baseline justify-between min-w-0">
          <span className="font-serif text-2xl font-medium tracking-tight tabular-nums">
            {year}
          </span>
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground shrink-0">
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
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 -mx-2 text-[12px] hover:bg-secondary/60 focus-visible:bg-secondary/60 transition-colors group/link"
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
                  <ChevronRight
                    className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 pt-1">
          {allTextVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-1.5 py-0.5 text-[10px] text-info">
              <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
              본문 검증
            </span>
          ) : (
            // C-10 (외부 리뷰 2026-05-12) — 검증 상태 안내 툴팁 추가.
            <span
              className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning"
              title="아직 운영자 검수가 완료되지 않은 문항이 포함되어 있습니다. 본문/답안은 정확하지만 일부 메타데이터는 검토 대기 중입니다."
            >
              <AlertCircle className="h-2.5 w-2.5" aria-hidden />
              일부 미검증
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 시대 라벨 — 단일 학년도면 단일, 복수면 범위 표기.
function formatEraLabel(eraName: string, years: number[]): string {
  if (years.length === 0) return eraName;
  const min = Math.min(...years);
  const max = Math.max(...years);
  if (min === max) return `${eraName} (${min}학년도)`;
  return `${eraName} (${min}~${max}학년도)`;
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
