import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMistakeCardsForPrint } from "@/lib/db/queries";
import { Markdown } from "@/components/shared/markdown";
import { formatExamStem } from "@/lib/exam/format-stem";
import { PrintActions } from "./_components/print-actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "오답노트 · 인쇄 · Fitly",
  description: "내 오답 카드를 A4 인쇄 또는 PDF 저장",
};

// 헌법 v3.5.1 제16조 — 오답 트랙의 자연스러운 출력 기능 (시행규칙 32 제34조 정합).
// 브라우저 인쇄 다이얼로그 → "PDF로 저장" 선택으로 외부 의존성 0.
//
// 레이아웃 — 한 카드당 1페이지 (`.print-card + .print-card` page break).
// 상단 본문 + 하단 AI 모범답안. globals.css @media print 규칙으로 chrome 숨김.
export default async function MistakePrintPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cards = await getMistakeCardsForPrint(user.id);

  return (
    <div className="print-root max-w-3xl mx-auto px-6 py-8 space-y-6">
      <PrintActions />

      <header className="no-print">
        <h1 className="font-serif text-2xl font-medium tracking-tight">
          오답노트
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
          내 오답 카드 {cards.length}장 · 우측 상단 &ldquo;인쇄 · PDF
          저장&rdquo; 버튼으로 브라우저 인쇄 다이얼로그를 여시고
          <br />
          대상 프린터에서 &ldquo;PDF로 저장&rdquo;을 선택하시면 됩니다.
        </p>
      </header>

      {/* 인쇄 헤더 — 화면에서는 숨김, 인쇄 시 첫 페이지 상단에만 노출. */}
      <header className="hidden print:block mb-8">
        <h1 className="font-serif text-xl font-bold">
          Fitly 오답노트 — {new Date().toLocaleDateString("ko-KR")}
        </h1>
        <p className="mt-1 text-[11px] text-muted-foreground">
          총 {cards.length}장
        </p>
      </header>

      {cards.length === 0 ? (
        <div className="no-print border border-rule border-dashed rounded-md p-10 text-center">
          <p className="font-serif text-base font-medium">
            아직 오답으로 합류된 카드가 없습니다.
          </p>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            풀이 트랙에서 다시 · 어렵 평가 시 자동 합류됩니다.
          </p>
        </div>
      ) : (
        <ol className="space-y-12 print:space-y-0">
          {cards.map((c, idx) => {
            const stem = formatExamStem(c.frontText);
            return (
              <li
                key={c.id}
                className="print-card border border-rule rounded-md p-6 print:rounded-none print:border-0"
              >
                <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    #{idx + 1} · {c.paperLabel ?? "—"}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {c.itemFormat && <span>{c.itemFormat}</span>}
                    {c.itemPoints != null && (
                      <span> · {c.itemPoints}점</span>
                    )}
                  </span>
                </div>

                <section className="mb-4">
                  <p className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                    본문
                  </p>
                  <div className="border-l-4 border-rule pl-4 py-1">
                    <p className="font-serif text-[13px] leading-[1.7] whitespace-pre-wrap text-foreground/90">
                      {stem || "(본문 비공개)"}
                    </p>
                  </div>
                </section>

                <section>
                  <p className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
                    AI 모범답안{c.verifiedAnswer ? " · 검증됨" : ""}
                  </p>
                  <div className="border-l-4 border-evergreen pl-4 py-1">
                    {c.backMd ? (
                      <Markdown serif>{c.backMd}</Markdown>
                    ) : (
                      <p className="text-[12.5px] text-muted-foreground">
                        본 카드의 답안 시드 대기 중.
                      </p>
                    )}
                  </div>
                </section>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
