import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { FileText, HardDrive, Layers } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MaterialsUploader } from "@/components/feature/materials/uploader";
import {
  MaterialRow,
  type MaterialRowItem,
} from "@/components/feature/materials/material-row";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";
import { materials } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

function formatMeta(
  mime: string | null,
  size: number | null,
  createdAt: Date,
): string {
  const mimeLabel = mime?.includes("pdf")
    ? "PDF"
    : mime?.startsWith("image/")
      ? "IMG"
      : (mime ?? "FILE");
  const sizeMb = size != null ? `${(size / 1024 / 1024).toFixed(1)}MB` : "—";
  const d = createdAt;
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  return `${mimeLabel} · ${sizeMb} · ${dateStr}`;
}

// 헌법 v1.10 — /materials 백엔드 와이어링.
// Supabase Storage('materials' 버킷) 직접 업로드 + 메타는 materials 테이블.
export default async function MaterialsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = getDb();
  const rows = await db
    .select()
    .from(materials)
    .where(eq(materials.userId, user.id))
    .orderBy(desc(materials.createdAt))
    .limit(60);

  const totalSize = rows.reduce((sum, r) => sum + (r.sizeBytes ?? 0), 0);
  const totalSizeMb = (totalSize / 1024 / 1024).toFixed(1);
  const totalPages = rows.reduce((sum, r) => sum + (r.pages ?? 0), 0);

  const items: MaterialRowItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    meta: formatMeta(r.mimeType, r.sizeBytes, r.createdAt),
    status: r.status,
  }));

  const stats = [
    { label: "전체 자료", value: `${rows.length}건`, Icon: FileText },
    { label: "총 용량", value: `${totalSizeMb}MB`, Icon: HardDrive },
    { label: "추출 페이지", value: `${totalPages}p`, Icon: Layers },
  ];

  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="자료 관리"
        subtitle="기출·교재 PDF를 업로드하면 자동으로 시카드로 변환됩니다."
      />
      <div className="px-6 grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="xl:col-span-2 space-y-3">
          <Card className="border-rule">
            <CardContent className="p-4">
              <h2 className="mb-3 font-serif text-lg font-medium tracking-tight">자료 업로드</h2>
              <MaterialsUploader />
            </CardContent>
          </Card>

          <Card className="border-rule">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-lg font-medium tracking-tight">내 자료</h2>
                <span className="text-[11px] text-muted-foreground">
                  최근 {Math.min(rows.length, 60)}건
                </span>
              </div>
              {items.length === 0 ? (
                <div className="grid place-items-center rounded-lg border border-dashed border-rule bg-background/50 py-12 text-center">
                  <FileText
                    className="h-8 w-8 text-muted-foreground/60"
                    aria-hidden
                  />
                  <p className="mt-2 text-sm font-medium">아직 자료가 없어요</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    위에서 첫 PDF·이미지를 업로드해 보세요.
                  </p>
                </div>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {items.map((it) => (
                    <MaterialRow key={it.id} item={it} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card className="border-rule">
            <CardContent className="p-4">
              <h2 className="mb-3 font-serif text-lg font-medium tracking-tight">자료 통계</h2>
              <ul className="space-y-2">
                {stats.map(({ label, value, Icon }) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 rounded-lg border border-rule bg-background px-3 py-2.5"
                  >
                    <span
                      aria-hidden
                      className="grid h-8 w-8 place-items-center rounded-md bg-secondary text-muted-foreground"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-[11px] text-muted-foreground">{label}</p>
                      <p className="font-serif text-base font-medium leading-tight num">{value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-warning/40 bg-warning/[0.06]">
            <CardContent className="p-5">
              <h2 className="font-serif text-lg font-medium tracking-tight">업로드 가이드</h2>
              <ul className="mt-2 space-y-1.5 text-[12px] text-foreground/80 leading-relaxed">
                <li>• 학원 자체 교재는 업로드 금지 (헌법 제27조 1항).</li>
                <li>• 공시·공개 출처의 기출만 인덱싱됩니다 (제27조 2항).</li>
                <li>
                  {"• AI 추출 정답·해설은 \"검증 필요\" 라벨이 부착됩니다 (제18조의2)."}
                </li>
                <li>• 본인 계정 폴더에만 저장되며 외부 노출되지 않습니다 (제28조).</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

