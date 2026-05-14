"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2, Send, Sparkles, Trash2, X } from "lucide-react";
import { Markdown } from "@/components/shared/markdown";
import { chatWithTutor, type ChatTutorResult } from "../actions";
import type { ChatMessage } from "@/lib/ai/gemini-tutor-chat";

// 헌법 v3.6.1 §16 단서 + §18 A 매트릭스 — AI 학습 도우미.
// PR 6/6 + hotfix (사용자 발화 2026-05-14) — 모달/백드롭/사이드 드로어 → 플로팅
// 위젯 형태로 재설계. 페이지 본문과 *동시 상호작용 가능*.
//
// 구현 요지
//   - 우측 *중앙* fixed FAB (z-30, 작은 원형 48x48 Sparkles)
//   - 클릭 → 우측 중앙 작은 플로팅 챗 박스 (380×min(540, 70vh)). 백드롭 없음
//   - 모바일(sm 이하) — 박스 폭 calc(100vw - 16px) 까지 자동 축소
//   - 빠른 프롬프트 5종 — 누르면 즉시 LLM 호출
//   - 대화 history — useState + localStorage `fitly:tutor-chat:${cardId}`
//   - 카드 전환 시 자동 로드/리셋
//
// 정합
//   - §3의2 (정직성) — system instruction 에 점수 표기 금지 명시 (서버측)
//   - §16 단서 v3.6.1 — 풀이 트랙 한정
//   - §16의2 (디자인 시스템) — evergreen / rule / cream-soft / error 토큰만

const STORAGE_KEY_PREFIX = "fitly:tutor-chat:";
const MAX_HISTORY_PERSIST = 32; // localStorage 에 보존할 최대 메시지 개수

type Props = {
  cardId: string;
  userAnswer: string;
};

type Status = "idle" | "sending";

type QuickPrompt = {
  key: string;
  label: string;
  prompt: string;
};

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    key: "explain",
    label: "다시 설명",
    prompt:
      "모범답안의 핵심 개념을 처음 배우는 학습자도 이해할 수 있게 다시 설명해 주세요.",
  },
  {
    key: "weakness",
    label: "내 약점",
    prompt:
      "제 답안에서 가장 먼저 개선하면 좋을 약점 한 가지만 콕 집어 알려 주세요.",
  },
  {
    key: "similar",
    label: "유사 기출",
    prompt:
      "이 주제와 비슷한 임용 1차 서술형 출제 흐름이나 유사 개념을 예시로 알려 주세요.",
  },
  {
    key: "memorize",
    label: "암기 카드",
    prompt:
      "모범답안의 핵심 키워드를 5~7개 추려 한 줄씩 정의 형태로 정리해 주세요.",
  },
  {
    key: "deepen",
    label: "심화",
    prompt:
      "이 주제를 더 깊게 공부하려면 어떤 관련 개념·이론을 함께 보면 좋을지 안내해 주세요.",
  },
];

export function AssistantFab({ cardId, userAnswer }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const storageKey = useMemo(
    () => `${STORAGE_KEY_PREFIX}${cardId}`,
    [cardId],
  );

  // 카드 전환 시 localStorage 복원 — paint 전에 hydrate (플리커 회피).
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.every(
            (m) =>
              m &&
              (m.role === "user" || m.role === "model") &&
              typeof m.text === "string",
          )
        ) {
          setMessages(parsed.slice(-MAX_HISTORY_PERSIST));
          return;
        }
      }
    } catch {
      // 파싱 실패 → 초기화.
    }
    setMessages([]);
  }, [storageKey]);

  // 메시지 변경 시 localStorage 저장. 빈 배열일 때는 키 삭제.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (messages.length === 0) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify(messages.slice(-MAX_HISTORY_PERSIST)),
        );
      }
    } catch {
      // localStorage 차단 시 무시 (대화는 세션 내 메모리로 유지).
    }
  }, [messages, storageKey]);

  // 드로어 열릴 때 / 메시지 추가 시 스크롤 하단으로.
  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, messages.length, status]);

  // ESC 로 드로어 닫기.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if (!msg) return;
      if (status === "sending") return;
      setError(null);
      const next: ChatMessage = { role: "user", text: msg };
      // 사용자 메시지 즉시 추가, 그 후 LLM 호출.
      const historyForCall = messages;
      setMessages((prev) => [...prev, next]);
      setInput("");
      setStatus("sending");
      const res: ChatTutorResult = await chatWithTutor({
        cardId,
        userAnswer,
        history: historyForCall,
        newMessage: msg,
      });
      setStatus("idle");
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "model", text: res.reply }]);
      } else {
        setError(res.error);
      }
    },
    [cardId, userAnswer, messages, status],
  );

  function clearHistory() {
    setMessages([]);
    setError(null);
  }

  return (
    <>
      {/* FAB — 우측 중앙, 작은 원형. 닫혀 있을 때만 노출. */}
      {!open && (
        <button
          type="button"
          aria-label="AI 학습 도우미 열기"
          onClick={() => setOpen(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-evergreen text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 focus-visible:ring-offset-2"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
        </button>
      )}

      {/* 플로팅 챗 박스 — 백드롭 없음. 페이지와 동시 상호작용 가능. */}
      {open && (
        <aside
          role="dialog"
          aria-label="AI 학습 도우미"
          className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col overflow-hidden rounded-lg border border-rule bg-card shadow-2xl"
          style={{
            width: "min(380px, calc(100vw - 16px))",
            height: "min(540px, calc(100vh - 32px))",
          }}
        >
          <Header
            onClose={() => setOpen(false)}
            onClear={clearHistory}
            hasHistory={messages.length > 0}
          />

          <QuickPromptBar
            onPick={(p) => send(p.prompt)}
            disabled={status === "sending"}
          />

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-cream-soft/40">
            {messages.length === 0 && status === "idle" && <EmptyState />}
            {messages.map((m, i) => (
              <ChatBubble key={i} message={m} />
            ))}
            {status === "sending" && <TypingBubble />}
            {error && <ErrorBubble reason={error} />}
            <div ref={messagesEndRef} />
          </div>

          <InputBar
            value={input}
            onChange={setInput}
            onSubmit={() => send(input)}
            disabled={status === "sending"}
          />
        </aside>
      )}
    </>
  );
}

function Header({
  onClose,
  onClear,
  hasHistory,
}: {
  onClose: () => void;
  onClear: () => void;
  hasHistory: boolean;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-rule px-4 py-3">
      <span className="inline-flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-evergreen" aria-hidden />
        <span className="font-serif text-[14px] font-medium tracking-tight">
          AI 학습 도우미
        </span>
      </span>
      {hasHistory && (
        <button
          type="button"
          onClick={onClear}
          className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          title="현재 카드의 대화 비우기"
        >
          <Trash2 className="h-3 w-3" aria-hidden />
          비우기
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className={`${
          hasHistory ? "ml-1" : "ml-auto"
        } inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40`}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function QuickPromptBar({
  onPick,
  disabled,
}: {
  onPick: (p: QuickPrompt) => void;
  disabled: boolean;
}) {
  return (
    <div className="border-b border-rule px-3 py-2.5">
      <p className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
        빠른 질문
      </p>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.key}
            type="button"
            disabled={disabled}
            onClick={() => onPick(p)}
            title={p.prompt}
            className="inline-flex items-center rounded-full border border-rule px-2.5 py-1 text-[11.5px] text-foreground/85 hover:bg-secondary/60 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <span
        aria-hidden
        className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-evergreen/10 text-evergreen"
      >
        <Sparkles className="h-5 w-5" />
      </span>
      <p className="font-serif text-[14px] font-medium tracking-tight">
        무엇이든 물어보세요
      </p>
      <p className="mt-2 max-w-xs text-[12px] leading-relaxed text-muted-foreground">
        본 카드의 본문·모범답안·내 답안을
        <br />
        도우미가 이미 알고 있습니다.
        <br />
        위의 빠른 질문을 누르거나 직접 입력해 주세요.
      </p>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-[13px] leading-[1.65] ${
          isUser
            ? "bg-evergreen text-white"
            : "bg-card border border-rule text-foreground/90"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        ) : (
          <Markdown serif={false}>{message.text}</Markdown>
        )}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="inline-flex items-center gap-2 rounded-lg border border-rule bg-card px-3.5 py-2 text-[12px] text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-evergreen" aria-hidden />
        도우미가 답하고 있습니다…
      </div>
    </div>
  );
}

function ErrorBubble({ reason }: { reason: string }) {
  const msg =
    reason === "NoReference"
      ? "모범답안이 시드되지 않아 답변할 수 없습니다."
      : reason === "TooLong"
        ? "메시지가 너무 깁니다 (최대 2000자)."
        : reason === "EmptyMessage"
          ? "빈 메시지는 보낼 수 없습니다."
          : reason === "Unauthorized"
            ? "다시 로그인해 주세요."
            : "도우미 응답에 일시적으로 실패했습니다. 잠시 후 다시 시도해 주세요.";
  return (
    <div className="flex justify-start">
      <div className="inline-flex items-start gap-2 rounded-lg border-l-[3px] border-l-error border-y border-r border-rule bg-error/5 px-3 py-2 text-[12px] text-error">
        {msg}
      </div>
    </div>
  );
}

function InputBar({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit();
    }
  }
  return (
    <div className="border-t border-rule bg-card p-3">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKey}
          rows={2}
          disabled={disabled}
          placeholder="질문을 입력해 주세요. Enter 전송, Shift+Enter 줄바꿈."
          className="flex-1 resize-none rounded-md border border-rule-strong bg-background px-3 py-2 text-[13px] leading-[1.6] focus:border-evergreen focus:outline-none focus:ring-2 focus:ring-evergreen/40 disabled:opacity-60 transition-colors"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || value.trim().length === 0}
          aria-label="전송"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-evergreen text-white hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
