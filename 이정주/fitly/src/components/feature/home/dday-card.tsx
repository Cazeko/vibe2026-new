import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { daysUntil } from "@/lib/utils";

type DDayCardProps = {
  examDate: string | null;
  university: string | null;
};

export function DDayCard({ examDate, university }: DDayCardProps) {
  if (!examDate || !university) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">시험일을 설정하세요</p>
              <p className="text-xs text-muted-foreground">
                목표 학교·시험일이 있어야 D-day와 적합도가 작동합니다.
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="text-sm font-semibold text-primary"
          >
            설정
          </Link>
        </CardContent>
      </Card>
    );
  }

  const days = daysUntil(examDate);
  const label = days === 0 ? "D-DAY" : `D-${days}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-xs text-muted-foreground">{university}대</p>
          <p className="text-3xl font-extrabold tracking-tight num">{label}</p>
          <p className="text-xs text-muted-foreground">{examDate}</p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl gauge-gradient text-white">
          <CalendarDays className="h-6 w-6" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}
