"use client";

// 헌법 v3.5.1 제16조 — 사용자 커스텀 해시태그 입력/표시.
// 카드 메타 인터랙션 다듬기 (시행규칙 32 제34조 정합).
//
// 동작 개요
//   - 표시: 기존 태그 chip (#태그) + "+ 태그 추가" 버튼
//   - 추가: 버튼 클릭 → input 노출 → Enter 로 commit, Escape/blur 시 취소
//   - 삭제: chip 의 X 버튼 클릭
//   - 낙관 업데이트 + 실패 시 롤백

import { useState, useTransition } from "react";
import { Plus, Tag as TagIcon, X } from "lucide-react";
import type { CardTag } from "@/lib/db/queries";
import { addCardTag, removeCardTag } from "../actions";

const TAG_LENGTH_MAX = 32;
const TAGS_PER_CARD_MAX = 12;

export function CardTags({
  cardId,
  initialTags,
}: {
  cardId: string;
  initialTags: CardTag[];
}) {
  const [tags, setTags] = useState<CardTag[]>(initialTags);
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const [, startTransition] = useTransition();

  const reachedMax = tags.length >= TAGS_PER_CARD_MAX;

  function cancel() {
    setAdding(false);
    setInput("");
  }

  function commit() {
    const v = input.trim();
    setInput("");
    setAdding(false);
    if (!v) return;
    const normalized = v.replace(/^#+/, "").trim();
    if (!normalized) return;
    // 중복 사전 검사 (낙관 측면).
    if (tags.some((t) => t.tag === normalized)) return;

    const tempId = `tmp-${Date.now()}`;
    const optimistic: CardTag = {
      id: tempId,
      tag: normalized,
      createdAt: new Date(),
    };
    setTags((prev) => [...prev, optimistic]);
    startTransition(async () => {
      const res = await addCardTag(cardId, v);
      if ("id" in res) {
        setTags((prev) =>
          prev.map((t) =>
            t.id === tempId ? { ...t, id: res.id, tag: res.tag } : t,
          ),
        );
      } else {
        setTags((prev) => prev.filter((t) => t.id !== tempId));
      }
    });
  }

  function handleRemove(id: string) {
    const backup = tags;
    setTags((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => {
      const res = await removeCardTag(id);
      if ("error" in res) setTags(backup);
    });
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      aria-label="카드 태그"
    >
      <TagIcon
        className="h-3.5 w-3.5 text-muted-foreground shrink-0"
        aria-hidden
      />
      {tags.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1 rounded-full bg-secondary/50 border border-rule px-2 py-0.5 text-[11px] text-foreground/85"
        >
          <span className="tabular-nums">#{t.tag}</span>
          <button
            type="button"
            onClick={() => handleRemove(t.id)}
            aria-label={`태그 #${t.tag} 제거`}
            className="inline-flex items-center justify-center w-3.5 h-3.5 -mr-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-2.5 w-2.5" aria-hidden />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          onBlur={commit}
          maxLength={TAG_LENGTH_MAX + 4}
          placeholder="태그 입력 → Enter"
          aria-label="새 태그 입력"
          className="rounded-full border border-rule bg-background px-2 py-0.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-evergreen/40 w-36"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={reachedMax}
          aria-label={reachedMax ? "태그 상한 도달" : "태그 추가"}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-rule px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-3 w-3" aria-hidden />
          태그
        </button>
      )}
      {reachedMax && !adding && (
        <span className="text-[10px] text-muted-foreground">
          ({tags.length}/{TAGS_PER_CARD_MAX})
        </span>
      )}
    </div>
  );
}
