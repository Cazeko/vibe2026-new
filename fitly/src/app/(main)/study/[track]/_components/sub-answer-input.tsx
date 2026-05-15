"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Minus, Split, Merge as MergeIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  detectSubQuestions,
  parseAnswer,
  serializeAnswer,
  nextLabel,
  type SubAnswer,
} from "@/lib/exam/sub-questions";

// 백승환 #6 (2026-05-15) — 서술형 소문항 답안 입력.
//
// 책임:
//   - 사용자가 단일 답안 ↔ 소문항 분리 모드 전환
//   - 소문항 분리 모드에서 N개 textarea + label 표기 + 추가/제거 버튼
//   - stem 자동 감지로 초기 라벨 제안 (제안 chip 클릭 시 1-tap 적용)
//   - 외부에는 단일 합산 string 만 노출 (server action 호환 정합)
//
// 입력 prop:
//   value     — 현재 합산 답안 (parent state)
//   onChange  — (next: string) => void
//   stemText  — 자동 감지용 (선택)

type Props = {
  value: string;
  onChange: (next: string) => void;
  stemText: string;
  pending: boolean;
  onSubmit: () => void;
  savedAt: number | null;
};

export function SubAnswerInput({
  value,
  onChange,
  stemText,
  pending,
  onSubmit,
  savedAt,
}: Props) {
  // 초기 parse — value 가 라벨 패턴을 포함하면 분리 모드, 아니면 단일 모드.
  const initialSubs = useMemo(() => parseAnswer(value), [value]);
  const initialIsMulti = initialSubs.length > 1;
  const [subs, setSubs] = useState<SubAnswer[]>(initialSubs);
  const [isMulti, setIsMulti] = useState(initialIsMulti);
  const lastValueRef = useRef(value);

  // value prop 외부 변경(카드 전환) 시 subs 재초기화.
  useEffect(() => {
    if (value === lastValueRef.current) return;
    lastValueRef.current = value;
    const parsed = parseAnswer(value);
    setSubs(parsed);
    setIsMulti(parsed.length > 1);
  }, [value]);

  // subs 변경 시 합산 string 외부 동기화.
  function commit(next: SubAnswer[]) {
    setSubs(next);
    const combined = serializeAnswer(next);
    lastValueRef.current = combined;
    onChange(combined);
  }

  function handleSingleChange(text: string) {
    commit([{ label: null, text }]);
  }

  function handleSubChange(idx: number, text: string) {
    const next = subs.map((s, i) => (i === idx ? { ...s, text } : s));
    commit(next);
  }

  function handleAddSub() {
    const labels = subs.map((s) => s.label);
    const newLabel = nextLabel(labels);
    commit([...subs, { label: newLabel, text: "" }]);
  }

  function handleRemoveSub(idx: number) {
    if (subs.length <= 1) return;
    const next = subs.filter((_, i) => i !== idx);
    commit(next);
  }

  function handleSplitMode() {
    setIsMulti(true);
    if (subs.length === 1 && !subs[0].label) {
      // 자동 감지된 라벨 셋이 있으면 그걸로 초기화, 아니면 (가)/(나) 2개.
      const detected = detectSubQuestions(stemText);
      const labels = detected.length >= 2 ? detected.slice(0, 3) : ["가", "나"];
      const existing = subs[0].text;
      commit(
        labels.map((l, i) => ({
          label: l,
          text: i === 0 ? existing : "",
        })),
      );
    }
  }

  function handleMergeMode() {
    // 라벨 보존 합쳐서 단일 답안으로.
    const merged = serializeAnswer(subs);
    setIsMulti(false);
    commit([{ label: null, text: merged }]);
  }

  // 자동 감지 라벨 제안 — 단일 모드에서 빈 textarea 일 때만 노출.
  const detected = useMemo(
    () => detectSubQuestions(stemText),
    [stemText],
  );
  const showSuggestion =
    !isMulti && subs.length === 1 && subs[0].text.trim() === "" && detected.length >= 2;

  function applySuggestion() {
    setIsMulti(true);
    commit(detected.slice(0, 5).map((l) => ({ label: l, text: "" })));
  }

  const totalLen = subs.reduce((sum, s) => sum + s.text.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <label
          htmlFor={isMulti ? undefined : "answer-input"}
          className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
        >
          내 답안
          {isMulti && (
            <span className="ml-1.5 normal-case tracking-normal text-foreground/70 font-normal">
              · 소문항 {subs.length}개
            </span>
          )}
        </label>
        <span
          className="inline-flex items-center gap-2 text-[10.5px] text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          {savedAt ? (
            <span className="inline-flex items-center gap-1 text-evergreen/80">
              <CheckCircle2 className="h-3 w-3" aria-hidden /> 자동 저장됨
            </span>
          ) : value ? (
            <span className="opacity-70">자동 저장 중…</span>
          ) : null}
          <span>{totalLen}자</span>
          <button
            type="button"
            onClick={isMulti ? handleMergeMode : handleSplitMode}
            aria-label={isMulti ? "소문항 합치기" : "소문항 분리"}
            title={isMulti ? "단일 답안으로 합치기" : "소문항으로 분리"}
            className="inline-flex items-center gap-1 rounded-full border border-rule px-2 py-0.5 text-[10.5px] text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
          >
            {isMulti ? (
              <>
                <MergeIcon className="h-3 w-3" aria-hidden />
                합치기
              </>
            ) : (
              <>
                <Split className="h-3 w-3" aria-hidden />
                소문항 분리
              </>
            )}
          </button>
        </span>
      </div>

      {showSuggestion && (
        <button
          type="button"
          onClick={applySuggestion}
          className="w-full text-left rounded-md border border-dashed border-evergreen/40 bg-evergreen/5 px-3 py-2 text-[11.5px] text-evergreen hover:bg-evergreen/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
        >
          본문에서 소문항 {detected.length}개 감지 — 클릭하면 라벨{" "}
          <span className="font-semibold">
            {detected.slice(0, 5).map((l) => formatLabelChip(l)).join(" · ")}
          </span>{" "}
          로 답안란을 자동 분할합니다.
        </button>
      )}

      {!isMulti ? (
        <textarea
          id="answer-input"
          value={subs[0]?.text ?? ""}
          onChange={(e) => handleSingleChange(e.target.value)}
          rows={14}
          className="w-full rounded-md border border-rule-strong bg-background px-3.5 py-3 text-[13.5px] leading-[1.7] resize-y focus:border-evergreen focus:outline-none focus:ring-2 focus:ring-evergreen/40 transition-colors min-h-[320px]"
          placeholder={"답안을 작성해 주세요.\n비워두고 채점도 가능합니다."}
        />
      ) : (
        <div className="space-y-3">
          {subs.map((s, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-full bg-evergreen/10 text-evergreen text-[11px] font-semibold tabular-nums">
                    {formatLabelChip(s.label)}
                  </span>
                  <span className="text-[10.5px] text-muted-foreground tabular-nums">
                    {s.text.length}자
                  </span>
                </span>
                {subs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSub(idx)}
                    aria-label={`소문항 ${formatLabelChip(s.label)} 제거`}
                    className="inline-flex items-center gap-1 rounded-full border border-rule px-1.5 py-0.5 text-[10.5px] text-muted-foreground hover:bg-error/5 hover:text-error hover:border-error/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
                  >
                    <Minus className="h-2.5 w-2.5" aria-hidden />
                    제거
                  </button>
                )}
              </div>
              <textarea
                value={s.text}
                onChange={(e) => handleSubChange(idx, e.target.value)}
                rows={5}
                className="w-full rounded-md border border-rule bg-background px-3 py-2.5 text-[13.5px] leading-[1.7] resize-y focus:border-evergreen focus:outline-none focus:ring-2 focus:ring-evergreen/40 transition-colors min-h-[120px]"
                placeholder={`${formatLabelChip(s.label)} 답안 작성`}
                aria-label={`소문항 ${formatLabelChip(s.label)} 답안`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddSub}
            disabled={subs.length >= 6}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-rule px-3 py-1.5 text-[11.5px] text-muted-foreground hover:bg-secondary/50 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
          >
            <Plus className="h-3 w-3" aria-hidden />
            소문항 추가
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={pending}>
          {pending ? "처리 중…" : "채점하기 — 답안 보기"}
        </Button>
      </div>
    </div>
  );
}

function formatLabelChip(label: string | null): string {
  if (!label) return "—";
  if (/^[가-힣]$/.test(label)) return `(${label})`;
  if (/^[1-6]$/.test(label)) return `${label})`;
  return label; // ① ② ③ 등
}
