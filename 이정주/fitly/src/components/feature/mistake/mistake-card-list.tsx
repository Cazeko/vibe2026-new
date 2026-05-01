import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MistakeCard } from "@/types";

type Item = MistakeCard & { id?: string; createdAt?: string };

type MistakeCardListProps = {
  items: Item[];
};

export function MistakeCardList({ items }: MistakeCardListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        저장된 오답 카드가 없습니다. 시험지를 업로드해 주세요.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((s, i) => (
        <li key={s.id ?? i}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm leading-snug">
                Q{i + 1}. {s.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {s.choices && s.choices.length > 0 && (
                <ol className="list-decimal pl-5 space-y-0.5 text-muted-foreground">
                  {s.choices.map((c, j) => (
                    <li key={j}>{c}</li>
                  ))}
                </ol>
              )}
              {s.answer && (
                <p>
                  <span className="font-medium">정답:</span> {s.answer}
                </p>
              )}
              {s.explanation && (
                <p className="text-muted-foreground">{s.explanation}</p>
              )}
              {s.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {s.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded bg-secondary px-2 py-0.5 text-xs"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              )}
              <span className="inline-block rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px]">
                내가 올린 시험지
              </span>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
