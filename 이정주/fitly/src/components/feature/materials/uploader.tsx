"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "uploading" | "saving" | "extracting" | "done" | "error";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";
const MAX_BYTES = 25 * 1024 * 1024; // 25MB

export function MaterialsUploader() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [extractedCount, setExtractedCount] = useState<number | null>(null);

  function pick(file: File | null) {
    setError(null);
    if (!file) {
      setPicked(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("파일이 25MB를 초과합니다.");
      return;
    }
    setPicked(file);
  }

  async function upload() {
    if (!picked) return;
    setStatus("uploading");
    setError(null);
    setProgress(10);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const ext = picked.name.split(".").pop()?.toLowerCase() ?? "bin";
      const safeName = picked.name.replace(/[^\w가-힣.\-]/g, "_");
      const path = `${user.id}/${Date.now()}-${safeName}`;

      const up = await supabase.storage
        .from("materials")
        .upload(path, picked, {
          cacheControl: "3600",
          upsert: false,
          contentType: picked.type || `application/${ext}`,
        });
      if (up.error) throw new Error(up.error.message);
      setProgress(70);

      setStatus("saving");
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: picked.name,
          storagePath: path,
          mimeType: picked.type,
          sizeBytes: picked.size,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "메타 저장 실패");

      // 헌법 제13조의2 — PDF/이미지 → 자동 시카드 추출 (Gemini).
      // 추출 결과는 mistakes 테이블에 source='material' 로 누적.
      const materialId = data.item?.id;
      if (materialId) {
        setStatus("extracting");
        setProgress(85);
        try {
          const ex = await fetch(`/api/materials/${materialId}/extract`, {
            method: "POST",
          });
          const exData = await ex.json();
          if (ex.ok) {
            setExtractedCount(exData.saved ?? 0);
          } else {
            // 추출 실패해도 업로드 자체는 성공 — 추후 재추출 가능.
            console.warn("자동 추출 실패:", exData.error);
            setExtractedCount(null);
          }
        } catch (extractErr) {
          console.warn("자동 추출 호출 실패:", extractErr);
          setExtractedCount(null);
        }
      }

      setProgress(100);
      setStatus("done");
      setPicked(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
      setTimeout(() => {
        setStatus("idle");
        setExtractedCount(null);
      }, 4000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "업로드 실패");
    }
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor="materials-upload"
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/60 bg-background/50 p-8 cursor-pointer transition-colors hover:bg-secondary/40"
      >
        <span
          aria-hidden
          className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"
        >
          <Upload className="h-5 w-5" />
        </span>
        <div className="text-center">
          <p className="text-sm font-semibold">PDF·이미지를 끌어다 놓거나 클릭하여 선택</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            기출/교재 PDF · 시험지 사진 — 25MB 이하
          </p>
        </div>
        <input
          ref={fileRef}
          id="materials-upload"
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </label>

      {picked && (
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-2">
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300"
          >
            <FileText className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate">{picked.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {(picked.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => pick(null)}
            aria-label="파일 제거"
            disabled={status === "uploading" || status === "saving"}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="h-8 rounded-xl"
            onClick={upload}
            disabled={
              status === "uploading" ||
              status === "saving" ||
              status === "extracting"
            }
          >
            {status === "uploading" ||
            status === "saving" ||
            status === "extracting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {status === "uploading"
                  ? "업로드 중…"
                  : status === "saving"
                    ? "저장 중…"
                    : "AI 카드 추출 중…"}
              </>
            ) : (
              <>업로드</>
            )}
          </Button>
        </div>
      )}

      {(status === "uploading" || status === "saving" || status === "extracting") && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {status === "done" && (
        <p role="status" className="text-[12px] text-emerald-600">
          업로드 완료
          {extractedCount != null && extractedCount > 0 && (
            <>
              {" — "}
              <strong>{extractedCount}장</strong>의 카드가 자동 추출되어 오답 노트에
              저장되었습니다.
            </>
          )}
          {extractedCount === 0 && (
            <> — 추출 가능한 카드가 발견되지 않았습니다.</>
          )}
        </p>
      )}
      {error && (
        <p role="alert" className="text-[12px] text-destructive">
          {error}
        </p>
      )}
      <p className="text-[10.5px] text-muted-foreground">
        ※ 파일은 본인 계정 폴더에 저장되며 (헌법 제28조 1항), 자동으로 시카드 변환됩니다.
        Supabase Storage 버킷 <code>materials</code>가 사전 생성되어 있어야 합니다.
      </p>
    </div>
  );
}
