"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Flag, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { reportCardIssue, REPORT_CATEGORIES } from "../actions";
import type { CardReportCategory } from "@/lib/db/schema";

// 헌법 시행규칙 33 §35 백업 매트릭스 — 사용자 AI 답안 신고 버튼.
// 코드리뷰 C.H2 (2026-05-15). 학습자가 모범답안·해설 오류를 즉시 보고.
// 풀이 카드 reveal 후 노출되며 카테고리 + 선택적 상세를 모달로 수집.

const CATEGORY_LABELS: Record<CardReportCategory, string> = {
  answer_wrong: "모범답안이 틀려요",
  explanation_unclear: "해설이 불명확해요",
  irrelevant: "본문과 관련 없어요",
  other: "기타 (상세 필수)",
};

const ERROR_LABELS: Record<string, string> = {
  Unauthorized: "로그인이 필요합니다.",
  InvalidCategory: "신고 항목이 올바르지 않습니다.",
  DetailTooLong: "상세 설명은 1000자 이하로 작성해 주세요.",
  DetailRequired: "기타 항목은 상세 설명이 필수입니다.",
  CardNotFound: "카드를 찾을 수 없습니다.",
  DailyLimitExceeded: "오늘 신고 한도(20회)를 초과하였습니다.",
  InsertFailed: "신고 접수 실패. 잠시 후 다시 시도해 주세요.",
};

export function ReportCardButton({ cardId }: { cardId: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<CardReportCategory>("answer_wrong");
  const [detail, setDetail] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<
    { type: "ok" | "err"; text: string } | null
  >(null);

  // useCallback 으로 안정화 — useEffect deps 정합 (lint exhaustive-deps).
  const close = useCallback(() => {
    setOpen(false);
    setCategory("answer_wrong");
    setDetail("");
    setMessage(null);
  }, []);

  // ESC 로 닫기.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const res = await reportCardIssue({ cardId, category, detail });
      if (res.ok) {
        setMessage({
          type: "ok",
          text: "신고가 접수되었습니다. 운영자가 검토합니다.",
        });
        setTimeout(close, 1800);
      } else {
        setMessage({
          type: "err",
          text: ERROR_LABELS[res.error] ?? "신고 접수 실패.",
        });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
        aria-label="이 카드 신고"
      >
        <Flag className="h-3 w-3" aria-hidden />
        신고
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="w-full max-w-md rounded-card border border-rule bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="report-dialog-title"
                className="text-[15px] font-semibold"
              >
                카드 신고
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="닫기"
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mb-3 text-[12px] text-muted-foreground">
              본 카드의 어떤 점이 문제인지 알려주세요.
              <br />
              운영자가 검토 후 정정합니다.
            </p>
            <fieldset className="mb-3 space-y-2">
              <legend className="sr-only">신고 항목</legend>
              {REPORT_CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className="flex cursor-pointer items-center gap-2 text-[13px]"
                >
                  <input
                    type="radio"
                    name="report-category"
                    value={cat}
                    checked={category === cat}
                    onChange={() => setCategory(cat)}
                    className="accent-evergreen"
                  />
                  {CATEGORY_LABELS[cat]}
                </label>
              ))}
            </fieldset>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value.slice(0, 1000))}
              maxLength={1000}
              placeholder={
                category === "other"
                  ? "상세 설명을 입력해 주세요 (필수)"
                  : "상세 설명 (선택, 최대 1000자)"
              }
              rows={3}
              className="w-full resize-none rounded-md border border-rule bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-evergreen/40"
            />
            <p className="mt-1 text-right text-[10.5px] text-muted-foreground tabular-nums">
              {detail.length} / 1000
            </p>
            {message && (
              <div
                className={cn(
                  "mt-2 text-[12px]",
                  message.type === "ok" ? "text-evergreen" : "text-destructive",
                )}
                role="status"
              >
                {message.text}
              </div>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="inline-flex h-9 items-center rounded-md px-3 text-[13px] text-muted-foreground hover:bg-secondary/60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-evergreen px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-evergreen-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? (
                  "전송 중…"
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden /> 제출
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
