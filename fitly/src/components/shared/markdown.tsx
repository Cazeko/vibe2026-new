// AI 답안·해설 정식 markdown 렌더링.
// cleanMarkdown(marker 제거 평문)에서 한 단계 진보 — 헤더·강조·리스트가 시각
// 계층으로 표현되어 가독성 향상. DESIGN.md 정합으로 토큰 사용 (rule·secondary
// 배경, evergreen 액센트 X — 액센트는 카드 보더에서 이미 사용).

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({
  children,
  className = "",
  serif = false,
}: {
  children: string;
  className?: string;
  serif?: boolean;
}) {
  if (!children?.trim()) return null;
  const fontClass = serif ? "font-serif" : "font-sans";
  return (
    <div className={`${fontClass} text-[14px] leading-[1.75] text-foreground/90 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-serif text-lg font-medium tracking-tight mt-4 mb-2 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-serif text-[15.5px] font-medium tracking-tight mt-4 mb-2 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-serif text-[14.5px] font-medium tracking-tight mt-3 mb-1.5 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="font-medium text-foreground mt-3 mb-1.5 first:mt-0">{children}</h4>
          ),
          p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
          // P1-05 (외부 리뷰 2026-05-12) — AI 모범답안 키워드 시각 위계 강화.
          // 노트 메타포(DESIGN §0)·학술 노트 underline 강조 정합. 형광펜식 배경
          // 색은 §4 컬러 토큰 보호 (warning·info 시맨틱 침범) 회피.
          // P1 코드 리뷰 M1 fix — 다크모드 rule-strong(L 29%) 위 foreground/90
          // (거의 흰색) underline 가독성 부족. 다크 전용 decoration 강화.
          strong: ({ children }) => (
            <strong className="font-bold text-foreground underline decoration-rule-strong dark:decoration-muted-foreground/60 decoration-2 underline-offset-[3px]">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic font-medium text-foreground/95">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 space-y-1 my-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 space-y-1 my-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-[1.65] pl-1">{children}</li>
          ),
          code: ({ children }) => (
            <code className="text-[0.92em] bg-secondary/60 px-1 py-0.5 rounded font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-secondary/60 p-3 rounded-md overflow-x-auto text-[12.5px] my-2">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-rule-strong pl-3 italic text-muted-foreground my-2">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-t border-rule my-4" />,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-info underline underline-offset-2 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="text-[12.5px] border-collapse w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-rule px-2 py-1 bg-secondary/40 text-left font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-rule px-2 py-1">{children}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
