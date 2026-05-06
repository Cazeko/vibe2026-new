import { Card, CardContent } from "@/components/ui/card";
import {
  getKeywordCloud,
  getDomainKeywords,
} from "@/lib/exam-analysis/queries";
import { EmptySeedNotice } from "./empty-seed-notice";

// 헌법 v3.5 제13조의2 정합 — 토픽맵: 키워드 빈도 클라우드 + 영역별 키워드.
// "클라우드"는 폰트 사이즈 단계(4단계)로만 표현 — 색은 단조롭게.

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
      <Card className="border-rule">
        <CardContent className="p-5">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-serif text-lg font-medium tracking-tight">
                반복 출제 키워드 클라우드
              </h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                상위 {cloud.length}개 — 폰트 크기는 누적 출제 빈도에 비례
              </p>
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
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

      <Card className="border-rule">
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
            <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              {byDomain.map((row) => (
                <li key={row.domain} className="border-l-2 border-rule pl-3">
                  <h4 className="font-serif text-[13px] font-medium tracking-tight">
                    {row.domain}
                  </h4>
                  <ol className="mt-1.5 space-y-1">
                    {row.keywords.map((k, idx) => (
                      <li
                        key={k.keyword}
                        className="flex items-baseline justify-between gap-2 text-[12px]"
                      >
                        <span className="flex items-baseline gap-1.5 min-w-0">
                          <span className="text-[10px] text-muted-foreground tabular-nums w-3 text-right">
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

  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 leading-none">
      {cloud.map((k) => (
        <span
          key={k.keyword}
          className="font-serif tracking-tight text-foreground"
          style={{ fontSize: sizeOf(k.count), opacity: opacityOf(k.count) }}
          title={`${k.keyword} · ${k.count}회 누적`}
        >
          {k.keyword}
        </span>
      ))}
    </div>
  );
}
