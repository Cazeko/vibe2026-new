import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
        <Link
          href="/home"
          className="flex items-center gap-2 text-base font-bold tracking-tight"
          aria-label="Fitly 홈"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg gauge-gradient text-white text-sm font-extrabold">
            F
          </span>
          <span>Fitly</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
