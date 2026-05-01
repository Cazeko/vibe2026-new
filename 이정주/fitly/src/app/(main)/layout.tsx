import { BottomGnb } from "@/components/shared/bottom-gnb";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-16">{children}</main>
      <BottomGnb />
    </div>
  );
}
