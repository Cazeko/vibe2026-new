import { AppHeader } from "@/components/shared/app-header";
import { BottomGnb } from "@/components/shared/bottom-gnb";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 pb-20">{children}</main>
      <BottomGnb />
    </div>
  );
}
