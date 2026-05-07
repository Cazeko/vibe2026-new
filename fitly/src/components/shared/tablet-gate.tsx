import { MonitorSmartphone } from "lucide-react";

// 헌법 v1.9 제5조 단서 — 시연 디바이스는 태블릿 가로(≥1024px).
// 좁은 뷰포트에서는 안내 문구로 대체한다 (Phase 2 모바일 반응형 예정).
export function TabletGate() {
  return (
    <div className="lg:hidden flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="max-w-sm space-y-4">
        <MonitorSmartphone
          className="mx-auto h-12 w-12 text-muted-foreground"
          aria-hidden
        />
        <h1 className="font-serif text-xl font-medium tracking-tight">
          태블릿 가로 모드를 권장합니다
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Fitly는 1024×768 이상 화면에서 가장 잘 동작합니다.
          <br />
          모바일 폰 화면 지원은 곧 업데이트될 예정입니다.
        </p>
      </div>
    </div>
  );
}
