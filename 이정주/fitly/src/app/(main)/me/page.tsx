import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCircle, Settings } from "lucide-react";

// 헌법 v1.9 제13조 7번 — 마이 페이지 (디자인 stub).
export default function MePage() {
  return (
    <div className="min-h-screen pb-10">
      <PageHeader title="마이 페이지" subtitle="프로필과 학습 기록을 관리합니다." />
      <div className="px-8 grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-secondary text-muted-foreground">
              <UserCircle className="h-10 w-10" aria-hidden />
            </span>
            <div className="flex-1">
              <p className="text-base font-semibold">프로필</p>
              <p className="text-xs text-muted-foreground">
                목표 학교·시험일은 설정에서 변경할 수 있습니다.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings">
                <Settings className="h-4 w-4" aria-hidden />
                설정
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="grid place-items-center p-12 text-center text-sm text-muted-foreground">
            학습 통계·뱃지·연속 기록은 D19 예정.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
