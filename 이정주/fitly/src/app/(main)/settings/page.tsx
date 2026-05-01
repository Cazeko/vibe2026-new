"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
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
import { UNIVERSITY_SEEDS } from "@/lib/data/universities";
import type { UniversityName } from "@/types";

type Profile = {
  targetUniversity: UniversityName | null;
  examDate: string | null;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    targetUniversity: null,
    examDate: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "조회 실패");
        if (data.profile) {
          setProfile({
            targetUniversity: (data.profile.targetUniversity ?? null) as
              | UniversityName
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
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md px-4 py-6 space-y-6 animate-fade-up">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          목표 학교와 시험일을 설정하면 D-day와 적합도가 활성화됩니다.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>목표 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 불러오는 중…
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="target-uni">목표 학교</Label>
                <Select
                  value={profile.targetUniversity ?? undefined}
                  onValueChange={(v) =>
                    setProfile((p) => ({
                      ...p,
                      targetUniversity: v as UniversityName,
                    }))
                  }
                >
                  <SelectTrigger id="target-uni" aria-label="목표 학교 선택">
                    <SelectValue placeholder="학교를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIVERSITY_SEEDS.map((u) => (
                      <SelectItem key={u.name} value={u.name}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
    </section>
  );
}
