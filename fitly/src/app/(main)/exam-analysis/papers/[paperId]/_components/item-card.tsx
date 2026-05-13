"use client";

import { useState } from "react";
import {
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  Maximize2,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/shared/markdown";
import { ExamItemLightbox } from "@/components/shared/exam-item-lightbox";
import { getExamPageUrl } from "@/lib/supabase/storage";
import type { ItemRow } from "@/lib/exam-analysis/queries";

// 백승환 피드백 #4·#5·#6 (2026-05-13) — 시험지 문항 카드를 client component 로
// 분리하여 Lightbox 모달 상태 관리. 페이지 자체는 SSR 유지.
// 리뷰 H3 fix — Item 타입은 ItemRow alias. 드리프트 회피.

type Props = {
  item: ItemRow;
  paperLabel: string;
  suppressIndividualBadge: boolean;
};

export function ItemCard({ item, paperLabel, suppressIndividualBadge }: Props) {
  const imageUrl = getExamPageUrl(item.stemImagePath);
  const [lightbox, setLightbox] = useState<{
    open: boolean;
    mode: "image" | "split" | "text";
  }>({ open: false, mode: "image" });

  function openLightbox(mode: "image" | "split" | "text") {
    setLightbox({ open: true, mode });
  }
  function closeLightbox() {
    setLightbox((s) => ({ ...s, open: false }));
  }

  return (
    <>
      <Card className="border-rule overflow-hidden">
        <CardContent className="p-0">
          <details className="group">
            <summary className="cursor-pointer list-none p-5 flex items-baseline justify-between flex-wrap gap-2 hover:bg-secondary/30 transition-colors select-none">
              <div className="flex items-baseline gap-2 min-w-0">
                <ChevronDown
                  className="h-4 w-4 shrink-0 self-center text-muted-foreground -rotate-90 group-open:rotate-0 transition-transform"
                  aria-hidden
                />
                <span className="font-serif text-lg font-medium tracking-tight tabular-nums">
                  {item.itemNo}번
                </span>
                {item.format && (
                  <span className="rounded-full border border-rule px-2 py-0.5 text-[10.5px] text-muted-foreground">
                    {item.format}
                  </span>
                )}
                {item.points != null && (
                  <span className="rounded-full border border-rule px-2 py-0.5 text-[10.5px] text-muted-foreground tabular-nums">
                    {item.points}점
                  </span>
                )}
                {item.bloom && (
                  <span className="rounded-full bg-info/10 px-2 py-0.5 text-[10.5px] text-info">
                    {item.bloom}
                  </span>
                )}
                {(item.domains.length > 0 || item.keywords.length > 0) && (
                  <span className="hidden md:inline text-[11.5px] text-muted-foreground/80 truncate max-w-[320px] group-open:hidden break-keep">
                    · {[...item.domains.slice(0, 1), ...item.keywords.slice(0, 2)].join(" · ")}
                  </span>
                )}
              </div>
              {item.verifiedAnswer ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-1.5 py-0.5 text-[10px] text-info shrink-0">
                  <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                  답안 검증
                </span>
              ) : suppressIndividualBadge ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground/70 shrink-0"
                  title="답안 검수 진행 중 (상단 일괄 안내 참조)"
                >
                  <AlertCircle className="h-2.5 w-2.5" aria-hidden />
                  검수 중
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning-text shrink-0">
                  <AlertCircle className="h-2.5 w-2.5" aria-hidden />
                  답안 검증 필요
                </span>
              )}
            </summary>

            <div className="px-5 pb-5 pt-1 border-t border-rule">
              {item.domains.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.domains.map((d) => (
                    <span
                      key={d}
                      className="rounded bg-secondary px-1.5 py-0.5 text-[10.5px] text-muted-foreground break-keep"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {/* 본문 이미지 — 클릭 시 Lightbox (이미지 모드). */}
              {imageUrl && (
                <div className="mt-4 rounded-md border border-rule overflow-hidden bg-paper relative group/img">
                  <button
                    type="button"
                    onClick={() => openLightbox("image")}
                    aria-label={`${item.itemNo}번 본문 이미지 확대 보기`}
                    className="block w-full overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`${item.itemNo}번 본문 이미지`}
                      className="block max-w-full h-auto mx-auto"
                      loading="lazy"
                    />
                  </button>
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1 text-[10px] text-cream backdrop-blur-sm opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                    <Maximize2 className="h-3 w-3" aria-hidden />
                    클릭 → 확대·텍스트 병렬
                  </span>
                </div>
              )}

              {/* 본문 텍스트 — 미리보기 + 전체보기 토글. */}
              {item.stemTextPreview && (
                <div className="mt-3 border-l-4 border-rule pl-3 py-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      본문 미리보기
                    </span>
                    {item.stemTextFull && item.stemTextFull.length > item.stemTextPreview.length && (
                      <button
                        type="button"
                        onClick={() => openLightbox("text")}
                        className="inline-flex items-center gap-1 text-[11px] text-evergreen border-b border-evergreen/60 hover:border-evergreen transition-colors"
                      >
                        <FileText className="h-3 w-3" aria-hidden />
                        전체 텍스트 보기
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[12.5px] text-foreground/80 leading-relaxed line-clamp-3 break-keep">
                    {item.stemTextPreview}
                    {item.stemTextFull && item.stemTextFull.length > item.stemTextPreview.length && "…"}
                  </p>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => openLightbox("split")}
                      className="mt-2 inline-flex items-center gap-1 text-[10.5px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      이미지 + 텍스트 분할로 보기
                    </button>
                  )}
                </div>
              )}

              {(item.answerMd || item.explanationMd) && (
                <details className="mt-4 group/answer">
                  <summary className="cursor-pointer list-none flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors select-none">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-rule text-[10px] group-open/answer:bg-evergreen/10 group-open/answer:border-evergreen group-open/answer:text-evergreen transition-colors">
                      +
                    </span>
                    <span>답안·해설 펼쳐보기</span>
                  </summary>
                  <div className="mt-4 space-y-4">
                    {item.answerMd && (
                      <Card className="border-l-[3px] border-l-evergreen border-y border-r border-rule bg-card">
                        <CardContent className="p-4">
                          <div className="text-[10.5px] uppercase tracking-[0.12em] text-evergreen mb-2">
                            AI 모범답안
                          </div>
                          <Markdown serif>{item.answerMd}</Markdown>
                        </CardContent>
                      </Card>
                    )}
                    {item.explanationMd && (
                      <Card className="border-l-[3px] border-l-info border-y border-r border-rule bg-card">
                        <CardContent className="p-4">
                          <div className="text-[10.5px] uppercase tracking-[0.12em] text-info mb-2">
                            해설
                          </div>
                          <Markdown>{item.explanationMd}</Markdown>
                        </CardContent>
                      </Card>
                    )}
                    {!item.verifiedAnswer && !suppressIndividualBadge && (
                      <p className="text-[10.5px] text-warning-text leading-relaxed">
                        ※ 운영자 검수 전 — AI 자동 생성 답안입니다. 학습 참고용으로 활용하세요.
                      </p>
                    )}
                  </div>
                </details>
              )}

              {!item.answerMd && !item.explanationMd && (
                <p className="mt-4 text-[11px] text-muted-foreground italic">
                  답안·해설이 아직 시드되지 않았습니다.
                </p>
              )}

              {item.keywords.length > 0 && (
                <div className="mt-3 pt-3 border-t border-rule flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    키워드
                  </span>
                  {item.keywords.map((k) => (
                    <span key={k} className="text-[11px] text-foreground/70 break-keep">
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </details>
        </CardContent>
      </Card>

      <ExamItemLightbox
        open={lightbox.open}
        onClose={closeLightbox}
        itemNo={item.itemNo}
        imageUrl={imageUrl}
        stemText={item.stemTextFull || item.stemTextPreview}
        paperLabel={paperLabel}
        initialMode={lightbox.mode}
      />
    </>
  );
}
