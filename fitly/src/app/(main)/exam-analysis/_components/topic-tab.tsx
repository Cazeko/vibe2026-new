import Link from "next/link";
import { Compass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  getKeywordCloud,
  getDomainKeywords,
} from "@/lib/exam-analysis/queries";
import { EmptySeedNotice } from "./empty-seed-notice";

// 헌법 v3.5 제13조의2 정합 — 토픽맵: 키워드 빈도 클라우드 + 영역별 키워드.
// "클라우드"는 폰트 사이즈 단계(4단계)로만 표현 — 색은 단조롭게.
//
// 사용자 보고 2026-05-12 반영:
// - 영역별 키워드 grid lg:3 → lg:2 로 컬럼 너비 확보 (긴 키워드 잘림 방지)
// - 클라우드 컨테이너 overflow-hidden + flex-wrap 보강
// - "빈도 ≠ 학습 우선순위" 안내 + 로드맵 탭 크로스링크 (헌법 제3조의2 정합)

export async function TopicTab() {
  const [cloud, byDomain] = await Promise.all([
    getKeywordCloud(60),
    getDomainKeywords(8),
  ]);

  if (cloud.length === 0 && byDomain.length === 0) {
    return (
      <EmptySeedNotice tabHint="반복 출제 키워드 클라우드 + 영역별 핵심 키워드" />
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-rule overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-serif text-lg font-medium tracking-tight">
                반복 출제 키워드 클라우드
              </h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                상위 {cloud.length}개 — 폰트 크기는 누적 출제 빈도에 비례
              </p>
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground shrink-0">
              {cloud.reduce((s, k) => s + k.count, 0)}회 누적
            </div>
          </div>
          {cloud.length === 0 ? (
            <p className="mt-4 text-[12.5px] text-muted-foreground">
              시드 적재 후 채워집니다.
            </p>
          ) : (
            <KeywordCloud cloud={cloud} />
          )}
        </CardContent>
      </Card>

      <Card className="border-rule overflow-hidden">
        <CardContent className="p-5">
          <h3 className="font-serif text-lg font-medium tracking-tight">
            영역별 핵심 키워드
          </h3>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            영역별 상위 8개 — 영역 학습 전 노트로 사용하세요.
          </p>
          {byDomain.length === 0 ? (
            <p className="mt-4 text-[12.5px] text-muted-foreground">
              시드 적재 후 채워집니다.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {byDomain.map((row) => (
                <li
                  key={row.domain}
                  className="border-l-2 border-rule pl-3 min-w-0"
                >
                  <h4 className="font-serif text-[13px] font-medium tracking-tight truncate">
                    {row.domain}
                  </h4>
                  <ol className="mt-1.5 space-y-1">
                    {row.keywords.map((k, idx) => (
                      <li
                        key={k.keyword}
                        className="flex items-baseline justify-between gap-2 text-[12px] min-w-0"
                      >
                        <span className="flex items-baseline gap-1.5 min-w-0">
                          <span className="text-[10px] text-muted-foreground tabular-nums w-3 text-right shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate">{k.keyword}</span>
                        </span>
                        <span className="text-[10.5px] text-muted-foreground tabular-nums shrink-0">
                          {k.count}회
                        </span>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 출제 빈도 ≠ 학습 우선순위 — 로드맵 탭으로 크로스링크 (헌법 제3조의2 정합) */}
      <aside className="rounded-md border border-rule bg-secondary/20 px-4 py-3 flex items-start gap-3">
        <Compass
          className="h-4 w-4 text-evergreen shrink-0 mt-0.5"
          aria-hidden
        />
        <div className="text-[12px] text-muted-foreground leading-relaxed min-w-0">
          <p className="text-foreground/85">
            <strong>출제 빈도</strong>는 <strong>학습 우선순위</strong>와
            동일하지 않습니다.
          </p>
          <p className="mt-1">
            본 토픽맵은 반복 출제 키워드의 빈도 분포만 보여 드립니다.
            학습 순서 권장은{" "}
            <Link
              href="/exam-analysis?tab=roadmap"
              className="text-evergreen border-b border-evergreen/60 hover:border-evergreen font-medium"
            >
              로드맵 탭 (S/A/B/C)
            </Link>
            의 누적 빈도 + 최근 5년 가중치 산식을 참고하세요.
          </p>
        </div>
      </aside>
    </div>
  );
}

function KeywordCloud({
  cloud,
}: {
  cloud: { keyword: string; count: number }[];
}) {
  if (cloud.length === 0) return null;
  const max = Math.max(...cloud.map((c) => c.count));
  // 4단계: 1.5 / 1.15 / 0.95 / 0.8 rem
  const sizeOf = (count: number): string => {
    const ratio = max > 0 ? count / max : 0;
    if (ratio >= 0.7) return "1.5rem";
    if (ratio >= 0.4) return "1.15rem";
    if (ratio >= 0.2) return "0.95rem";
    return "0.8rem";
  };
  const opacityOf = (count: number): number => {
    const ratio = max > 0 ? count / max : 0;
    return 0.55 + ratio * 0.45;
  };

  // overflow-hidden + flex-wrap 강제 — 좁은 컨테이너에서 한 줄이 컨테이너를
  // 넘어가는 현상 차단 (사용자 보고 2026-05-12)
  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-2 leading-tight overflow-hidden max-w-full">
      {cloud.map((k) => (
        <span
          key={k.keyword}
          className="font-serif tracking-tight text-foreground break-keep"
          style={{
            fontSize: sizeOf(k.count),
            opacity: opacityOf(k.count),
            wordBreak: "keep-all",
          }}
          title={`${k.keyword} · ${k.count}회 누적`}
        >
          {k.keyword}
        </span>
      ))}
    </div>
  );
}
