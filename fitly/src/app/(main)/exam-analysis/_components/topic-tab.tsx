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
            <>
              <KeywordCloud cloud={cloud} />
              {/* P1-09 (외부 리뷰 2026-05-12) — 워드클라우드만으로는 빈도 정확 비교가
                  어려움. 상위 10개를 막대그래프로 보조 노출하여 직관성 보강.
                  §4.3 evergreen 보호 — bar 색은 muted-foreground/45 (시맨틱 외 중성). */}
              <KeywordTopBar cloud={cloud} />
            </>
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
            // 주인님 보고 #14 (2026-05-14) — 키워드와 횟수 간격이 너무 넓어 보이던
            // 회귀. justify-between 을 버리고 *키워드 직후* 횟수를 인라인으로 붙여
            // 넓은 간극 제거. 영역별 컬럼은 3열까지 확장 (xl) 하여 좁아진 간격
            // 만큼 다른 과목으로 채움.
            <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-3">
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
                        className="text-[12px] min-w-0 flex items-baseline gap-1.5"
                      >
                        <span className="text-[10px] text-muted-foreground tabular-nums w-3 text-right shrink-0">
                          {idx + 1}
                        </span>
                        <span className="break-keep">
                          {k.keyword}
                          <span className="ml-1.5 text-[10.5px] text-muted-foreground tabular-nums">
                            {k.count}회
                          </span>
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

function KeywordTopBar({
  cloud,
}: {
  cloud: { keyword: string; count: number }[];
}) {
  const top = cloud.slice(0, 10);
  if (top.length === 0) return null;
  const max = Math.max(...top.map((k) => k.count));
  return (
    <div className="mt-5 pt-4 border-t border-rule">
      <p className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
        상위 10개 빈도 비교
      </p>
      <ul className="space-y-1.5">
        {top.map((k, idx) => {
          const pct = max > 0 ? (k.count / max) * 100 : 0;
          // v3.6 외부 평가 #4.1 — 1~3위 evergreen 채움, 4~10위는 중성 회색.
          // §4.3 evergreen 6 사용처 보호 안에서 *top-tier 강조* 단서로 인정.
          const isTop3 = idx < 3;
          return (
            <li
              key={k.keyword}
              className="flex items-center gap-2.5 text-[12px]"
            >
              <span
                className={`w-4 text-right text-[10px] tabular-nums shrink-0 ${
                  isTop3 ? "text-evergreen font-bold" : "text-muted-foreground"
                }`}
              >
                {idx + 1}
              </span>
              <span
                className={`w-28 truncate shrink-0 ${
                  isTop3 ? "font-bold text-foreground" : "font-medium"
                }`}
              >
                {k.keyword}
              </span>
              <span className="flex-1 h-2 bg-rule dark:bg-rule-soft rounded-full overflow-hidden">
                <span
                  className={`block h-full rounded-full ${
                    isTop3 ? "bg-evergreen" : "bg-foreground/30"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="w-12 text-right text-[10.5px] text-muted-foreground tabular-nums shrink-0">
                {k.count}회
              </span>
            </li>
          );
        })}
      </ul>
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

  // 주인님 보고 #15 (2026-05-14) — 칩 내부 텍스트가 baseline 정렬이라 글자가
  // 박스 중심에서 어긋나 보이던 회귀. inline-flex + items-center 로 글자가
  // 항상 칩의 *세로 중앙* 에 오도록 정합. items-baseline → items-center 로 전환
  // 시 컨테이너의 leading-tight 도 함께 보정.
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 leading-tight">
      {cloud.map((k) => (
        <span
          key={k.keyword}
          className="inline-flex items-center justify-center max-w-full rounded-md border border-rule px-2 py-0.5 font-serif tracking-tight bg-card/50 text-center"
          style={{ fontSize: sizeOf(k.count), wordBreak: "keep-all" }}
          title={`${k.keyword} · ${k.count}회 누적`}
        >
          <span
            className="text-foreground"
            style={{ opacity: opacityOf(k.count) }}
          >
            {k.keyword}
          </span>
        </span>
      ))}
    </div>
  );
}
