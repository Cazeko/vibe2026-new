import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Layers, RefreshCw, type LucideIcon } from "lucide-react";

type StudyMode = {
  href: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  badge?: string;
};

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
    badge: "준비 중",
  },
  {
    href: "/study/review",
    title: "시카드 복습",
    description: "내 오답 시카드를 SRS로 자동 복습",
    Icon: RefreshCw,
    badge: "v1",
  },
];

export default function StudyPage() {
  return (
    <section className="mx-auto w-full max-w-md px-4 py-6 space-y-6 animate-fade-up">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">학습</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          오늘의 학습 모드를 선택하세요.
        </p>
      </header>

      <ul className="space-y-3">
        {modes.map(({ href, title, description, Icon, badge }) => (
          <li key={href}>
            <Link
              href={href}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[var(--radius)]"
            >
              <Card className="transition-colors hover:bg-secondary/60">
                <CardContent className="flex items-center gap-4 p-4">
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
    </section>
  );
}
