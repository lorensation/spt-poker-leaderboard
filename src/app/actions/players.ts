"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/security/admin";
import { generateEditToken, hashEditToken, verifyEditToken } from "@/lib/security/tokens";
import { getAdminSupabase } from "@/lib/supabase/server";
import { uploadAvatar } from "@/lib/supabase/storage";

export type ActionState = { ok: boolean; message: string; token?: string; playerId?: string };

function cleanNickname(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createPlayer(formData: FormData): Promise<ActionState> {
  try {
    const nickname = cleanNickname(formData.get("nickname"));
    if (nickname.length < 2 || nickname.length > 32) {
      return { ok: false, message: "Nickname must be 2 to 32 characters." };
    }

    const token = generateEditToken();
    const editTokenHash = await hashEditToken(token);
    const avatar = formData.get("avatar");
    const avatarUrl = avatar instanceof File && avatar.size > 0 ? await uploadAvatar(avatar, "players") : null;

    const { data, error } = await getAdminSupabase()
      .from("players")
      .insert({ nickname, edit_token_hash: editTokenHash, avatar_url: avatarUrl })
      .select("id")
      .single();

    if (error) {
      return {
        ok: false,
        message: error.code === "23505" ? "That nickname is already taken." : error.message,
      };
    }

    revalidatePath("/");
    revalidatePath("/leaderboard/money");
    revalidatePath("/leaderboard/points");
    return { ok: true, message: "Player created.", token, playerId: data.id };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not create player." };
  }
}

export async function editPlayer(formData: FormData): Promise<ActionState> {
  try {
    const playerId = String(formData.get("playerId") ?? "");
    const editToken = String(formData.get("editToken") ?? "");
    const nickname = cleanNickname(formData.get("nickname"));
    const removeAvatar = formData.get("removeAvatar") === "on";
    const avatar = formData.get("avatar");
    const supabase = getAdminSupabase();
    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("edit_token_hash")
      .eq("id", playerId)
      .maybeSingle();

    if (playerError || !player) return { ok: false, message: "Player not found." };
    if (!(await verifyEditToken(editToken, player.edit_token_hash))) {
      return { ok: false, message: "This browser cannot edit that player." };
    }

    const updates: Record<string, string | null> = {};
    if (nickname) updates.nickname = nickname;
    if (removeAvatar) updates.avatar_url = null;
    if (avatar instanceof File && avatar.size > 0) {
      updates.avatar_url = await uploadAvatar(avatar, playerId);
    }

    const { error } = await supabase.from("players").update(updates).eq("id", playerId);
    if (error) return { ok: false, message: error.message };

    revalidatePath("/");
    revalidatePath("/leaderboard/money");
    revalidatePath("/leaderboard/points");
    revalidatePath(`/players/${nickname}`);
    return { ok: true, message: "Player updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not update player." };
  }
}

export async function adminCreatePlayer(formData: FormData) {
  await requireAdmin();
  const result = await createPlayer(formData);
  if (!result.ok) throw new Error(result.message);
  revalidatePath("/admin");
}

export async function adminUpdatePlayer(formData: FormData) {
  await requireAdmin();
  const playerId = String(formData.get("playerId") ?? "");
  const nickname = cleanNickname(formData.get("nickname"));
  const removeAvatar = formData.get("removeAvatar") === "on";
  const avatar = formData.get("avatar");
  const updates: Record<string, string | null> = {};
  if (nickname) updates.nickname = nickname;
  if (removeAvatar) updates.avatar_url = null;
  if (avatar instanceof File && avatar.size > 0) updates.avatar_url = await uploadAvatar(avatar, playerId);

  const { error } = await getAdminSupabase().from("players").update(updates).eq("id", playerId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function adminDeletePlayer(formData: FormData) {
  await requireAdmin();
  const playerId = String(formData.get("playerId") ?? "");
  const { error } = await getAdminSupabase().from("players").delete().eq("id", playerId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
}
