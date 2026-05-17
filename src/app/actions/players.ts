"use server";

import { revalidatePath } from "next/cache";

import { logTransaction, safeErrorMessage } from "@/lib/logger";
import { requireAdmin } from "@/lib/security/admin";
import { generateEditToken, hashEditToken, verifyEditToken } from "@/lib/security/tokens";
import { getAdminSupabase } from "@/lib/supabase/server";
import { uploadAvatar } from "@/lib/supabase/storage";
import type { ActionResult } from "@/lib/types";

export type PlayerActionData = { token?: string; playerId?: string };

function cleanNickname(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createPlayer(formData: FormData): Promise<ActionResult<PlayerActionData>> {
  const nickname = cleanNickname(formData.get("nickname"));
  try {
    if (nickname.length < 2 || nickname.length > 32) {
      logTransaction({ operation: "create_player", success: false, payload: { nicknameLength: nickname.length }, error: "invalid nickname" });
      return { success: false, message: "Nickname must be 2 to 32 characters." };
    }

    const token = generateEditToken();
    const editTokenHash = await hashEditToken(token);
    const avatar = formData.get("avatar");
    const avatarUrl = avatar instanceof File && avatar.size > 0 ? await uploadAvatar(avatar, "players") : null;
    if (avatarUrl) {
      logTransaction({ operation: "upload_avatar", success: true, payload: { scope: "player_create", nickname } });
    }

    const { data, error } = await getAdminSupabase()
      .from("players")
      .insert({ nickname, edit_token_hash: editTokenHash, avatar_url: avatarUrl })
      .select("id")
      .single();

    if (error) {
      logTransaction({ operation: "create_player", success: false, payload: { nickname }, error });
      return {
        success: false,
        message: error.code === "23505" ? "That nickname is already taken." : error.message,
        error: error.message,
      };
    }

    revalidatePath("/");
    revalidatePath("/leaderboard/money");
    revalidatePath("/leaderboard/points");
    logTransaction({ operation: "create_player", success: true, payload: { playerId: data.id, nickname } });
    return { success: true, message: avatarUrl ? "Player created. Avatar uploaded successfully." : "Player created.", data: { token, playerId: data.id } };
  } catch (error) {
    logTransaction({ operation: "create_player", success: false, payload: { nickname }, error });
    return { success: false, message: "Could not create player.", error: safeErrorMessage(error) };
  }
}

export async function editPlayer(formData: FormData): Promise<ActionResult> {
  const playerId = String(formData.get("playerId") ?? "");
  try {
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

    if (playerError || !player) return { success: false, message: "Player not found.", error: playerError?.message };
    if (!(await verifyEditToken(editToken, player.edit_token_hash))) {
      return { success: false, message: "This browser cannot edit that player." };
    }

    const updates: Record<string, string | null> = {};
    if (nickname) updates.nickname = nickname;
    if (removeAvatar) updates.avatar_url = null;
    if (avatar instanceof File && avatar.size > 0) {
      updates.avatar_url = await uploadAvatar(avatar, playerId);
      logTransaction({ operation: "upload_avatar", success: true, payload: { scope: "player_update", playerId } });
    }

    const { error } = await supabase.from("players").update(updates).eq("id", playerId);
    if (error) {
      logTransaction({ operation: "update_player", success: false, payload: { playerId }, error });
      return { success: false, message: error.code === "23505" ? "That nickname is already taken." : error.message, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/leaderboard/money");
    revalidatePath("/leaderboard/points");
    revalidatePath(`/players/${nickname}`);
    logTransaction({ operation: "update_player", success: true, payload: { playerId } });
    return { success: true, message: updates.avatar_url ? "Player updated. Avatar uploaded successfully." : "Player updated." };
  } catch (error) {
    logTransaction({ operation: "update_player", success: false, payload: { playerId }, error });
    return { success: false, message: "Could not update player.", error: safeErrorMessage(error) };
  }
}

export async function adminCreatePlayer(formData: FormData): Promise<ActionResult<PlayerActionData>> {
  try {
    await requireAdmin();
    const result = await createPlayer(formData);
    revalidatePath("/admin");
    return result;
  } catch (error) {
    logTransaction({ operation: "admin_create_player", success: false, payload: {}, error });
    return { success: false, message: "Could not create player.", error: safeErrorMessage(error) };
  }
}

export async function adminUpdatePlayer(formData: FormData): Promise<ActionResult> {
  const playerId = String(formData.get("playerId") ?? "");
  try {
    await requireAdmin();
    const nickname = cleanNickname(formData.get("nickname"));
    const removeAvatar = formData.get("removeAvatar") === "on";
    const avatar = formData.get("avatar");
    const updates: Record<string, string | null> = {};
    if (nickname) updates.nickname = nickname;
    if (removeAvatar) updates.avatar_url = null;
    if (avatar instanceof File && avatar.size > 0) {
      updates.avatar_url = await uploadAvatar(avatar, playerId);
      logTransaction({ operation: "upload_avatar", success: true, payload: { scope: "admin_player_update", playerId } });
    }

    const { error } = await getAdminSupabase().from("players").update(updates).eq("id", playerId);
    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/admin");
    logTransaction({ operation: "admin_update_player", success: true, payload: { playerId } });
    return { success: true, message: updates.avatar_url ? "Player updated. Avatar uploaded successfully." : "Player updated." };
  } catch (error) {
    logTransaction({ operation: "admin_update_player", success: false, payload: { playerId }, error });
    return { success: false, message: "Could not update player.", error: safeErrorMessage(error) };
  }
}

export async function adminDeletePlayer(formData: FormData): Promise<ActionResult> {
  const playerId = String(formData.get("playerId") ?? "");
  try {
    await requireAdmin();
    const { error } = await getAdminSupabase().from("players").delete().eq("id", playerId);
    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/admin");
    logTransaction({ operation: "admin_delete_player", success: true, payload: { playerId } });
    return { success: true, message: "Player deleted." };
  } catch (error) {
    logTransaction({ operation: "admin_delete_player", success: false, payload: { playerId }, error });
    return { success: false, message: "Could not delete player.", error: safeErrorMessage(error) };
  }
}
