"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, LogOut, Sun, Moon, Monitor, Info } from "lucide-react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { REGION_NAMES, type RegionName } from "@/types";
import { createClient } from "@/lib/supabase/client";

// 헌법 v3.0 — userProfiles.targetUniversity 컬럼은 region 라벨로 임시 재해석.
type Profile = {
  targetRegion: RegionName | null;
  examDate: string | null;
};

const THEME_OPTIONS = [
  { value: "light", label: "라이트", Icon: Sun },
  { value: "dark", label: "다크", Icon: Moon },
  { value: "system", label: "시스템", Icon: Monitor },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [profile, setProfile] = useState<Profile>({
    targetRegion: null,
    examDate: null,
  });
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    fetch("/api/user/profile")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "조회 실패");
        if (data.profile) {
          setProfile({
            targetRegion: (data.profile.targetUniversity ?? null) as
              | RegionName
              | null,
            examDate: data.profile.examDate ?? null,
          });
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "오류"))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // v3.0 — userProfiles.targetUniversity 컬럼에 region 라벨을 그대로 저장 (D-S2 컬럼 재정렬 예정).
        body: JSON.stringify({
          targetUniversity: profile.targetRegion,
          examDate: profile.examDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    if (!confirm("로그아웃 하시겠습니까?")) return;
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="설정"
        subtitle="지역 교육청·테마·계정을 관리합니다."
      />
      <div className="px-6 grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* 목표 설정 */}
        <Card className="xl:col-span-2 border-rule">
          <CardHeader>
            <CardTitle className="text-sm">목표 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 불러오는 중…
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="target-region">지역 교육청</Label>
                  <Select
                    value={profile.targetRegion ?? undefined}
                    onValueChange={(v) =>
                      setProfile((p) => ({
                        ...p,
                        targetRegion: v as RegionName,
                      }))
                    }
                  >
                    <SelectTrigger id="target-region" aria-label="지역 교육청 선택">
                      <SelectValue placeholder="지역 교육청을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGION_NAMES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    17개 지역 교육청 중 선택 (선택 입력). 합격 컷은 공개되지 않습니다.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="exam-date">시험일</Label>
                  <Input
                    id="exam-date"
                    type="date"
                    value={profile.examDate ?? ""}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        examDate: e.target.value || null,
                      }))
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    설정 시 대시보드의 D-day가 활성화됩니다.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      저장 중…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" aria-hidden />
                      저장
                    </>
                  )}
                </Button>

                {success && (
                  <p role="status" className="text-sm text-primary">
                    저장되었습니다.
                  </p>
                )}
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* 테마 + 계정 */}
        <div className="space-y-3">
          <Card className="border-rule">
            <CardHeader>
              <CardTitle className="text-sm">테마</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(({ value, label, Icon }) => {
                  const active =
                    mounted && (theme === value || (value === "system" && theme === "system"));
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-[11px] transition-colors ${
                        active
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-rule hover:bg-secondary/40"
                      }`}
                      aria-pressed={active}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {label}
                    </button>
                  );
                })}
              </div>
              {mounted && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  현재: <strong>{resolvedTheme === "dark" ? "다크" : "라이트"}</strong>
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-rule">
            <CardHeader>
              <CardTitle className="text-sm">계정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-xl border border-rule bg-background px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">로그인 이메일</p>
                <p className="mt-0.5 text-[13px] font-medium truncate">
                  {email ?? "—"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={signOut}
                disabled={signingOut}
                className="w-full"
              >
                {signingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <LogOut className="h-4 w-4" aria-hidden />
                )}
                로그아웃
              </Button>
            </CardContent>
          </Card>

          <Card className="border-warning/40 bg-warning/[0.06]">
            <CardContent className="p-5 flex gap-3">
              <Info className="h-4 w-4 text-warning shrink-0 mt-0.5" aria-hidden />
              <div className="text-[12px] text-foreground/80 leading-relaxed">
                <p className="font-semibold">개인정보·저작권 정책</p>
                <ul className="mt-1.5 space-y-0.5 text-[11px]">
                  <li>• 학습 기록은 본인만 접근합니다.</li>
                  <li>• 인강·사설 교재 인덱싱은 하지 않습니다.</li>
                  <li>• 합격 보장·점수 예측 표현은 사용하지 않습니다.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
