import Link from "next/link";
import { BookOpen, Layers, RefreshCw, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

type StudyMode = {
  href: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  badge?: string;
};

// 헌법 v1.9 제13조 2번 — 학습 플랜 메뉴.
// 활동 라우트(/study/vocab, /study/exam, /study/review)는 변경 없이 유지.
const modes: StudyMode[] = [
  {
    href: "/study/vocab",
    title: "영단어 SRS",
    description: "FSRS 간격 반복으로 핵심 어휘 누적",
    Icon: BookOpen,
    badge: "v1",
  },
  {
    href: "/study/exam",
    title: "기출 풀이",
    description: "TOP 10 대학 출제 패턴 기반 학습",
    Icon: Layers,
    badge: "v1",
  },
  {
    href: "/study/review",
    title: "시카드 복습",
    description: "내 오답 시카드를 SRS로 자동 복습",
    Icon: RefreshCw,
    badge: "v1",
  },
];

export default function StudyPlanPage() {
  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="학습 플랜"
        subtitle="오늘의 학습 모드를 선택하세요."
      />
      <div className="px-8">
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modes.map(({ href, title, description, Icon, badge }) => (
            <li key={href}>
              <Link
                href={href}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
              >
                <Card className="rounded-2xl border-0 shadow-sm transition-colors hover:bg-secondary/40">
                  <CardContent className="flex items-center gap-4 p-5">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{title}</p>
                        {badge && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                            {badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
