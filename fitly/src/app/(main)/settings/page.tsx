"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { useProfile } from "@/components/shared/profile-provider";

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

// 헌법 §16의2 정합 — focus-visible은 evergreen tint(40%)로 통일 (CTA 정합).
// C-14 (외부 리뷰 2026-05-12) — Select chevron·Input 우측 아이콘 18px 로 확대.
// [&_svg]:h-4.5 [&_svg]:w-4.5 로 trigger 내부 svg 일괄 보정 (hitbox 어포던스).
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evergreen/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background [&_svg]:h-[18px] [&_svg]:w-[18px]";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  // 코드리뷰 B.H2/H3 (2026-05-15 PR-8) — layout SSR profile context 사용.
  // 종전 useEffect mount fetch 패턴 제거. email 도 동일 context 에서 합성.
  const ssrProfile = useProfile();
  const initialFromSsr: Profile = {
    targetRegion: ssrProfile?.targetRegion ?? null,
    examDate: ssrProfile?.examDate ?? null,
  };
  const [profile, setProfile] = useState<Profile>(initialFromSsr);
  // I3 dirty state 추적 — 초기 로드값 보관 후 변경 비교.
  const [initialProfile, setInitialProfile] = useState<Profile>(initialFromSsr);
  const email = ssrProfile?.email ?? null;
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  // 코드리뷰 B.H5 (2026-05-15 PR-10) — Supabase 클라이언트 lazy init 일관성.
  // signOut 핸들러에서 createClient() 매 클릭 호출하던 패턴을 통일.
  const [supabase] = useState(() => createClient());
  // C2 자동 dismiss 타이머 — unmount/재트리거 시 cleanup.
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // C2 success/error 3초 후 자동 dismiss (S2 aria-live 정합).
  useEffect(() => {
    if (!success && !error) return;
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setSuccess(false);
      setError(null);
    }, 3000);
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [success, error]);

  // I3 dirty state — 변경 없을 시 저장 버튼 비활성.
  const isDirty = useMemo(
    () =>
      profile.targetRegion !== initialProfile.targetRegion ||
      profile.examDate !== initialProfile.examDate,
    [profile, initialProfile],
  );

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
      setInitialProfile(profile);
      router.refresh();
    } catch {
      // C3 raw 에러 노출 금지.
      setError("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    if (!confirm("로그아웃 하시겠습니까?")) return;
    setSigningOut(true);
    // 코드리뷰 L10 (2026-05-15) — 다른 탭에 로그아웃 신호 broadcast.
    if (typeof window !== "undefined") {
      window.localStorage.setItem("fitly:logout-broadcast", String(Date.now()));
      window.localStorage.removeItem("fitly:logout-broadcast");
    }
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen pb-10">
      <PageHeader
        title="설정"
        // B1 subtitle 명료화 — 무엇을 관리하는지 단번에 전달.
        subtitle="지역 교육청·시험일 설정 + 테마·계정 관리"
      />
      {/* P1-03 (외부 리뷰 2026-05-12) — 폼 max-width 제약. 종전 wrapper 가 페이지
          전체 폭이라 xl(1280+) 에서 폼 카드가 800px+ 로 늘어남. 폼 가독성 위해
          페이지를 max-w-5xl(1024) 로 제한하여 좌측 ~640·우측 ~320 컬럼 정돈. */}
      <div className="px-6 mx-auto max-w-5xl grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* 목표 설정 */}
        <Card className="xl:col-span-2 border-rule">
          <CardHeader>
            <CardTitle className="text-sm">목표 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!mounted ? (
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
                    <SelectTrigger
                      id="target-region"
                      aria-label="지역 교육청 선택"
                      className={FOCUS_RING}
                    >
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
                    {/* B2 모호 표현 정리 — "선택 사항입니다." */}
                    17개 지역 교육청 중 선택. 선택 사항입니다.
                    <br />
                    합격 컷은 공개되지 않습니다.
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
                    className={FOCUS_RING}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {/* B3 헌법 §31 금기어 "D-day" 위반 → 한글 재표현. */}
                    설정 시 대시보드에 시험까지 남은 날짜가 표시됩니다.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={save}
                  // I3 변경 없을 시 비활성 + saving 중 비활성.
                  disabled={saving || !isDirty}
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

                {/* C2·D2·S2 — 메시지 박스 강조 배경 + aria-live 정합. */}
                <div aria-live="polite" aria-atomic="true">
                  {success && (
                    <p
                      role="status"
                      className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary"
                    >
                      저장되었습니다.
                    </p>
                  )}
                  {error && (
                    <p
                      role="alert"
                      className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
                      {error}
                    </p>
                  )}
                </div>
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
                      // G2 focus-visible ring + hover bg.
                      className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-[11px] transition-colors ${FOCUS_RING} ${
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
              {/* D3 readonly 시각 명시 (bg-muted) + A2 title 속성으로 truncate 풀 노출. */}
              <div className="rounded-lg border border-rule bg-muted/40 px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">
                  로그인 이메일{" "}
                  <span className="ml-1 text-[10px] uppercase tracking-[0.1em]">
                    읽기 전용
                  </span>
                </p>
                <p
                  className="mt-0.5 text-[13px] font-medium truncate"
                  title={email ?? undefined}
                >
                  {email ?? "—"}
                </p>
              </div>
              {/* v3.6 외부 평가 #5.10 — 로그아웃은 파괴적 액션이므로 destructive
                  tone (붉은 보더 + 텍스트) 으로 분리감 강조. */}
              <Button
                type="button"
                variant="outline"
                onClick={signOut}
                disabled={signingOut}
                className="w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive"
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

          <Card className="border-l-[3px] border-l-warning border-y border-r border-rule bg-secondary/30">
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
