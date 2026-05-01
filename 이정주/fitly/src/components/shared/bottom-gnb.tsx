"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, ClipboardList, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type GnbItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

const items: GnbItem[] = [
  { href: "/home", label: "홈", Icon: Home },
  { href: "/study", label: "학습", Icon: BookOpen },
  { href: "/mistakes", label: "내 오답", Icon: ClipboardList },
];

export function BottomGnb() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주 메뉴"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background"
    >
      <ul className="mx-auto flex w-full max-w-md items-stretch">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs",
                  active
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
