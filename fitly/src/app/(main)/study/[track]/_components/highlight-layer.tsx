"use client";

// 헌법 v3.5.1 제16조 — 사용자 형광펜/밑줄 클라이언트 레이어.
// 카드 본문 인터랙션 다듬기로 분류 (시행규칙 32 제34조 정합).
//
// 동작 개요
//   1) 자식(마크다운/평문) 렌더 직후 컨테이너 ref 로 접근.
//   2) onMouseUp 으로 selection 캡처 → quote + prefix(20)/suffix(20) 추출
//      → 인라인 툴팁(노랑·초록·분홍·밑줄) 노출.
//   3) 색 선택 시 createHighlight server action 호출 + 낙관 업데이트.
//   4) 저장된 하이라이트는 useEffect 에서 DOM textNode 순회로 quote 매칭 후
//      Range 단위로 <mark> 래핑. ZWSP(markdown.tsx 의 CJK 단어 경계 보정)는
//      매칭 시 제거 + 원본 offset 매핑 보존하여 wrap 위치 정합 보장.
//   5) 기존 mark 클릭 시 floating 삭제 메뉴 노출 → deleteHighlight 호출.
//
// anchor 매칭 전략 — fallback ladder.
//   (prefix + quote + suffix) → (prefix + quote) → (quote + suffix) → quote
//   매칭 실패 시 silently skip (해설/본문 변경 시 ghost 하이라이트 자연 소실).

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Trash2 } from "lucide-react";
import type { CardHighlight } from "@/lib/db/queries";
import { createHighlight, deleteHighlight } from "../actions";

type Color = "yellow" | "green" | "pink" | "underline";
type Surface = "back_md" | "front_text";

const ANCHOR_CONTEXT = 20;
const ZWSP = "​";
const MARK_ATTR = "data-fitly-hl";

// DESIGN.md §4.3 정합 — evergreen 6 사용처 보호 + markdown.tsx strong 의 gold-soft
// 와 분리. Tailwind JIT 가 추적 가능하도록 literal 객체로 보존한다.
const COLOR_CLASS: Record<Color, string> = {
  yellow:
    "bg-yellow-200/70 dark:bg-yellow-300/25 px-0.5 rounded-[2px] cursor-pointer transition-colors",
  green:
    "bg-emerald-200/70 dark:bg-emerald-300/25 px-0.5 rounded-[2px] cursor-pointer transition-colors",
  pink:
    "bg-pink-200/70 dark:bg-pink-300/25 px-0.5 rounded-[2px] cursor-pointer transition-colors",
  underline:
    "underline decoration-foreground/60 decoration-2 underline-offset-[3px] cursor-pointer transition-colors",
};

const COLOR_DOT: Record<Color, string> = {
  yellow: "bg-yellow-300",
  green: "bg-emerald-300",
  pink: "bg-pink-300",
  underline: "bg-foreground/60",
};

const COLOR_LABEL: Record<Color, string> = {
  yellow: "노랑",
  green: "초록",
  pink: "분홍",
  underline: "밑줄",
};

export function HighlightLayer({
  cardId,
  surface,
  initialHighlights,
  children,
}: {
  cardId: string;
  surface: Surface;
  initialHighlights: CardHighlight[];
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<CardHighlight[]>(() =>
    initialHighlights.filter((h) => h.surface === surface),
  );
  const [, startTransition] = useTransition();

  const [pickMenu, setPickMenu] = useState<{
    x: number;
    y: number;
    quote: string;
    prefix: string;
    suffix: string;
  } | null>(null);

  const [editMenu, setEditMenu] = useState<{
    x: number;
    y: number;
    id: string;
  } | null>(null);

  // 카드 전환 시 props 의 initialHighlights 가 갱신되면 surface 분리하여 재설정.
  useEffect(() => {
    setItems(initialHighlights.filter((h) => h.surface === surface));
    setPickMenu(null);
    setEditMenu(null);
  }, [cardId, surface, initialHighlights]);

  // selection 캡처.
  const handleMouseUp = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setPickMenu(null);
      return;
    }
    const range = sel.getRangeAt(0);
    // 컨테이너 외부 또는 mark 내부면 무시 (mark 는 click 핸들러가 따로 처리).
    if (!root.contains(range.commonAncestorContainer)) {
      setPickMenu(null);
      return;
    }
    const rawQuote = sel.toString();
    const quote = rawQuote.replace(new RegExp(ZWSP, "g"), "").trim();
    if (quote.length < 1) {
      setPickMenu(null);
      return;
    }

    const fullText = (root.textContent ?? "").replace(
      new RegExp(ZWSP, "g"),
      "",
    );
    const idx = fullText.indexOf(quote);
    const prefix =
      idx > 0 ? fullText.slice(Math.max(0, idx - ANCHOR_CONTEXT), idx) : "";
    const suffix =
      idx >= 0
        ? fullText.slice(
            idx + quote.length,
            idx + quote.length + ANCHOR_CONTEXT,
          )
        : "";

    const rect = range.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    setPickMenu({
      x: rect.left + rect.width / 2 - rootRect.left,
      y: rect.top - rootRect.top - 8,
      quote,
      prefix,
      suffix,
    });
    setEditMenu(null);
  }, []);

  // 컨테이너 내 mark 클릭 위임 — 삭제 메뉴 노출.
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const mark = target.closest(`mark[${MARK_ATTR}]`) as HTMLElement | null;
    const root = containerRef.current;
    if (!mark || !root) {
      setEditMenu(null);
      return;
    }
    const id = mark.getAttribute(MARK_ATTR);
    if (!id) return;
    const rect = mark.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    setEditMenu({
      id,
      x: rect.left + rect.width / 2 - rootRect.left,
      y: rect.top - rootRect.top - 8,
    });
    setPickMenu(null);
  }, []);

  // 색 선택 → 낙관 업데이트 + server action.
  function onPickColor(color: Color) {
    if (!pickMenu) return;
    const { quote, prefix, suffix } = pickMenu;
    setPickMenu(null);
    window.getSelection()?.removeAllRanges();
    // 낙관: 임시 id 부여.
    const tempId = `tmp-${Date.now()}`;
    const optimistic: CardHighlight = {
      id: tempId,
      surface,
      quote,
      prefix,
      suffix,
      color,
      createdAt: new Date(),
    };
    setItems((prev) => [...prev, optimistic]);
    startTransition(async () => {
      const res = await createHighlight({
        cardId,
        surface,
        quote,
        prefix,
        suffix,
        color,
      });
      if ("id" in res) {
        setItems((prev) =>
          prev.map((h) => (h.id === tempId ? { ...h, id: res.id } : h)),
        );
      } else {
        // 실패 시 롤백.
        setItems((prev) => prev.filter((h) => h.id !== tempId));
      }
    });
  }

  // 삭제 — 낙관 업데이트 + server action.
  function onDelete(id: string) {
    setEditMenu(null);
    const backup = items;
    setItems((prev) => prev.filter((h) => h.id !== id));
    startTransition(async () => {
      const res = await deleteHighlight(id);
      if ("error" in res) {
        setItems(backup);
      }
    });
  }

  // 저장된 하이라이트 wrap.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    // 1) 기존 mark 모두 해제.
    unwrapAllMarks(root);
    // 2) 각 항목 적용.
    for (const h of items) applyHighlight(root, h);
  });

  // 외부 클릭 시 메뉴 닫기.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const root = containerRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) {
        setPickMenu(null);
        setEditMenu(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      className="relative"
    >
      {children}

      {pickMenu && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-full"
          style={{ left: pickMenu.x, top: pickMenu.y }}
          role="menu"
          aria-label="형광펜 색 선택"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="inline-flex items-center gap-1 rounded-md border border-rule bg-card/95 backdrop-blur-md shadow-md px-1.5 py-1">
            {(Object.keys(COLOR_CLASS) as Color[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onPickColor(c)}
                aria-label={`${COLOR_LABEL[c]} 형광펜`}
                className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 transition-colors"
              >
                {c === "underline" ? (
                  <span
                    aria-hidden
                    className="block w-4 border-b-2 border-foreground/60"
                  />
                ) : (
                  <span
                    aria-hidden
                    className={`block h-3.5 w-3.5 rounded-full ${COLOR_DOT[c]}`}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="mx-auto w-2 h-2 -mt-px rotate-45 bg-card border-r border-b border-rule" />
        </div>
      )}

      {editMenu && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-full"
          style={{ left: editMenu.x, top: editMenu.y }}
          role="menu"
          aria-label="하이라이트 메뉴"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="inline-flex items-center gap-1 rounded-md border border-rule bg-card/95 backdrop-blur-md shadow-md px-1 py-1">
            <button
              type="button"
              onClick={() => onDelete(editMenu.id)}
              aria-label="형광펜 지우기"
              className="inline-flex items-center gap-1 px-2 h-7 text-[11.5px] text-error hover:bg-error/5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              지우기
            </button>
          </div>
          <div className="mx-auto w-2 h-2 -mt-px rotate-45 bg-card border-r border-b border-rule" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// DOM wrap 알고리즘
// ============================================================

function unwrapAllMarks(root: HTMLElement) {
  const marks = root.querySelectorAll(`mark[${MARK_ATTR}]`);
  marks.forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  });
  root.normalize();
}

function makeMark(h: CardHighlight): HTMLElement {
  const mark = document.createElement("mark");
  mark.setAttribute(MARK_ATTR, h.id);
  mark.setAttribute("data-color", h.color);
  mark.className = COLOR_CLASS[h.color as Color] ?? "";
  return mark;
}

function applyHighlight(root: HTMLElement, h: CardHighlight) {
  // 1) textNode 수집 (이미 mark 내부는 skip — 중첩 방지).
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      let p = node.parentElement;
      while (p && p !== root) {
        if (
          p.tagName === "MARK" &&
          p.hasAttribute(MARK_ATTR)
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  if (nodes.length === 0) return;

  // 2) ZWSP 제거된 plain + (global stripped offset → node, raw offset) 매핑.
  let plain = "";
  const map: { node: Text; start: number; offsetMap: number[] }[] = [];
  for (const node of nodes) {
    const raw = node.textContent ?? "";
    const offsetMap: number[] = []; // stripped local idx → raw local idx
    let stripped = "";
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] !== ZWSP) {
        offsetMap.push(i);
        stripped += raw[i];
      }
    }
    map.push({ node, start: plain.length, offsetMap });
    plain += stripped;
  }

  // 3) fallback ladder 로 quote 위치 결정.
  const targets: { needle: string; quoteIn: number }[] = [
    { needle: h.prefix + h.quote + h.suffix, quoteIn: h.prefix.length },
    { needle: h.prefix + h.quote, quoteIn: h.prefix.length },
    { needle: h.quote + h.suffix, quoteIn: 0 },
    { needle: h.quote, quoteIn: 0 },
  ];
  let startGlobal = -1;
  for (const t of targets) {
    if (!t.needle) continue;
    const idx = plain.indexOf(t.needle);
    if (idx >= 0) {
      startGlobal = idx + t.quoteIn;
      break;
    }
  }
  if (startGlobal < 0) return;
  const endGlobal = startGlobal + h.quote.length;

  // 4) global stripped offset → (Text node, raw offset).
  function locate(globalOffset: number): { node: Text; offset: number } | null {
    for (let i = map.length - 1; i >= 0; i--) {
      const m = map[i];
      if (globalOffset >= m.start) {
        const local = globalOffset - m.start;
        if (local <= m.offsetMap.length) {
          const rawOffset =
            local < m.offsetMap.length
              ? m.offsetMap[local]
              : (m.node.textContent?.length ?? 0);
          return { node: m.node, offset: rawOffset };
        }
      }
    }
    return null;
  }
  const startLoc = locate(startGlobal);
  const endLoc = locate(endGlobal);
  if (!startLoc || !endLoc) return;

  // 5) Range 생성 → textNode 단위로 분할 wrap (boundary 안정성).
  let range: Range;
  try {
    range = document.createRange();
    range.setStart(startLoc.node, startLoc.offset);
    range.setEnd(endLoc.node, endLoc.offset);
  } catch {
    return;
  }
  wrapRangeByTextNodes(root, range, h);
}

function wrapRangeByTextNodes(
  root: HTMLElement,
  range: Range,
  h: CardHighlight,
) {
  // single-textNode 범위는 단순 surroundContents.
  if (
    range.startContainer === range.endContainer &&
    range.startContainer.nodeType === Node.TEXT_NODE
  ) {
    try {
      range.surroundContents(makeMark(h));
    } catch {
      /* boundary 어긋남 — skip */
    }
    return;
  }

  // 다중 노드 범위 — 범위 내 textNode 별로 잘라 wrap.
  const inRange: { node: Text; start: number; end: number }[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    const len = t.textContent?.length ?? 0;
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(t);
    const startsBefore =
      range.compareBoundaryPoints(Range.START_TO_END, nodeRange) <= 0;
    const endsAfter =
      range.compareBoundaryPoints(Range.END_TO_START, nodeRange) >= 0;
    if (startsBefore || endsAfter) continue;
    const start = t === range.startContainer ? range.startOffset : 0;
    const end = t === range.endContainer ? range.endOffset : len;
    if (start < end) inRange.push({ node: t, start, end });
  }
  // 역순 wrap — 앞 노드 변경이 뒷 인덱스에 영향 X.
  for (let i = inRange.length - 1; i >= 0; i--) {
    const { node, start, end } = inRange[i];
    try {
      const sub = document.createRange();
      sub.setStart(node, start);
      sub.setEnd(node, end);
      sub.surroundContents(makeMark(h));
    } catch {
      /* skip */
    }
  }
}
