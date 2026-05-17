import "server-only";

import { getAdminSupabase } from "@/lib/supabase/server";

export async function uploadAvatar(file: File, prefix: string) {
  if (!file || file.size === 0) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${prefix}/${crypto.randomUUID()}.${extension}`;
  const supabase = getAdminSupabase();
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
    upsert: true,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
