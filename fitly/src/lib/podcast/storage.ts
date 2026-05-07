import "server-only";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// 헌법 §17 보안 — 본인 user-scope 폴더만 본인이 INSERT/UPDATE.
// 'shared/' 폴더는 service_role 만 INSERT (RLS bypass).
// public bucket이라 SELECT는 모든 인증 사용자 + 익명 read OK.

export async function uploadPodcastAudio(
  audioWav: Buffer,
  opts: {
    scope: "shared" | "user";
    userId: string | null;
    episodeId: string;
  },
): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase env (URL or SERVICE_ROLE_KEY) missing");
  }
  const supabase = createServiceClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const folder = opts.scope === "shared" ? "shared" : opts.userId;
  if (!folder) throw new Error("user scope requires userId");
  const path = `${folder}/${opts.episodeId}.wav`;

  const { error } = await supabase.storage
    .from("podcast-audio")
    .upload(path, audioWav, {
      contentType: "audio/wav",
      upsert: true,
    });
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from("podcast-audio")
    .getPublicUrl(path);
  return data.publicUrl;
}
