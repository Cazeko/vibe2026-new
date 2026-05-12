import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// 헌법 제27조 정합 — 시드 미적재 시점의 일관 fallback (4 탭 공유).
// P1-04 (외부 리뷰 2026-05-12) — 아이콘을 원형 토큰 배경으로 강조, 헤더 위계 보강.
export function EmptySeedNotice({ tabHint }: { tabHint: string }) {
  return (
    <Card className="border-rule border-dashed">
      <CardContent className="p-8 text-center">
        <span
          aria-hidden
          className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-cream-deep text-muted-foreground"
        >
          <BookOpen className="h-6 w-6" />
        </span>
        <p className="font-serif text-base font-medium tracking-tight">
          시드 적재 후 자동 활성화됩니다
        </p>
        <p className="mt-2 text-[12.5px] text-muted-foreground leading-relaxed max-w-xl mx-auto">
          24년치 공개 기출(KICE)이 시드되면 본 탭에 {tabHint}가 자동으로
          표시됩니다. 본 페이지의 시각화는 모두 공식 기출에서 자동 생성되며,
          외부 학원·인강 자료에 의존하지 않습니다.
        </p>
      </CardContent>
    </Card>
  );
}
