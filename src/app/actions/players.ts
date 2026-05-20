"use server";

import { revalidatePath } from "next/cache";

import { getCurrentPlayer, normalizeEmail } from "@/lib/auth/player";
import { logTransaction, safeErrorMessage } from "@/lib/logger";
import { requireAdmin } from "@/lib/security/admin";
import { getAdminSupabase } from "@/lib/supabase/server";
import { uploadAvatar } from "@/lib/supabase/storage";
import type { ActionResult } from "@/lib/types";

export type PlayerActionData = { token?: string; playerId?: string };

function cleanNickname(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createPlayer(formData: FormData): Promise<ActionResult<PlayerActionData>> {
  const nickname = cleanNickname(formData.get("nickname"));
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  try {
    await requireAdmin();
    if (nickname.length < 2 || nickname.length > 32) {
      logTransaction({ operation: "create_player", success: false, payload: { nicknameLength: nickname.length }, error: "invalid nickname" });
      return { success: false, message: "Nickname must be 2 to 32 characters." };
    }
    if (email && !email.includes("@")) {
      return { success: false, message: "Enter a valid email address or leave it blank." };
    }

    const avatar = formData.get("avatar");
    const avatarUrl = avatar instanceof File && avatar.size > 0 ? await uploadAvatar(avatar, "players") : null;
    if (avatarUrl) {
      logTransaction({ operation: "upload_avatar", success: true, payload: { scope: "player_create", nickname } });
    }

    const { data, error } = await getAdminSupabase()
      .from("players")
      .insert({ nickname, avatar_url: avatarUrl, created_by_admin: true })
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

    if (email) {
      const { error: identityError } = await getAdminSupabase()
        .from("player_identities")
        .insert({ player_id: data.id, email });
      if (identityError) throw identityError;
    }

    revalidatePath("/");
    revalidatePath("/leaderboard/money");
    revalidatePath("/leaderboard/points");
    revalidatePath("/admin");
    logTransaction({ operation: "create_player", success: true, payload: { playerId: data.id, nickname } });
    return { success: true, message: avatarUrl ? "Player created. Avatar uploaded successfully." : "Player created.", data: { playerId: data.id } };
  } catch (error) {
    logTransaction({ operation: "create_player", success: false, payload: { nickname }, error });
    return { success: false, message: "Could not create player.", error: safeErrorMessage(error) };
  }
}

export async function editPlayer(formData: FormData): Promise<ActionResult> {
  let playerId = "";
  try {
    const currentPlayer = await getCurrentPlayer();
    if (!currentPlayer) {
      return { success: false, message: "Sign in before updating your profile." };
    }
    playerId = currentPlayer.playerId;
    const removeAvatar = formData.get("removeAvatar") === "on";
    const avatar = formData.get("avatar");

    const updates: Record<string, string | null> = {};
    if (removeAvatar) updates.avatar_url = null;
    if (avatar instanceof File && avatar.size > 0) {
      updates.avatar_url = await uploadAvatar(avatar, playerId);
      logTransaction({ operation: "upload_avatar", success: true, payload: { scope: "player_update", playerId } });
    }
    if (!("avatar_url" in updates)) {
      return { success: false, message: "Choose an avatar or remove the current one." };
    }

    const { error } = await getAdminSupabase().from("players").update(updates).eq("id", playerId);
    if (error) {
      logTransaction({ operation: "update_player", success: false, payload: { playerId }, error });
      return { success: false, message: error.code === "23505" ? "That nickname is already taken." : error.message, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/leaderboard/money");
    revalidatePath("/leaderboard/points");
    revalidatePath("/profile");
    revalidatePath(`/players/${encodeURIComponent(currentPlayer.player.nickname)}`);
    logTransaction({ operation: "update_player", success: true, payload: { playerId } });
    return { success: true, message: updates.avatar_url ? "Player updated. Avatar uploaded successfully." : "Player updated." };
  } catch (error) {
    logTransaction({ operation: "update_player", success: false, payload: { playerId }, error });
    return { success: false, message: "Could not update player.", error: safeErrorMessage(error) };
  }
}

export async function adminCreatePlayer(formData: FormData): Promise<ActionResult<PlayerActionData>> {
  try {
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
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const resetIdentity = formData.get("resetIdentity") === "on";
    const removeAvatar = formData.get("removeAvatar") === "on";
    const avatar = formData.get("avatar");
    const updates: Record<string, string | null> = {};
    if (nickname) updates.nickname = nickname;
    if (email && !email.includes("@")) {
      return { success: false, message: "Enter a valid email address or leave it blank." };
    }
    if (removeAvatar) updates.avatar_url = null;
    if (avatar instanceof File && avatar.size > 0) {
      updates.avatar_url = await uploadAvatar(avatar, playerId);
      logTransaction({ operation: "upload_avatar", success: true, payload: { scope: "admin_player_update", playerId } });
    }

    const supabase = getAdminSupabase();
    const { error } = await supabase.from("players").update(updates).eq("id", playerId);
    if (error) throw error;

    const { data: existingIdentity } = await supabase
      .from("player_identities")
      .select("email")
      .eq("player_id", playerId)
      .maybeSingle();

    if (email) {
      if (existingIdentity) {
        const identityUpdates: Record<string, string | null> = { email };
        if (existingIdentity.email !== email || resetIdentity) {
          identityUpdates.auth_user_id = null;
          identityUpdates.claimed_at = null;
        }
        const { error: identityError } = await supabase
          .from("player_identities")
          .update(identityUpdates)
          .eq("player_id", playerId);
        if (identityError) throw identityError;
      } else {
        const { error: identityError } = await supabase
          .from("player_identities")
          .insert({ player_id: playerId, email });
        if (identityError) throw identityError;
      }
    } else if (existingIdentity) {
      const { error: identityError } = await supabase
        .from("player_identities")
        .delete()
        .eq("player_id", playerId);
      if (identityError) throw identityError;
    }

    if (resetIdentity && email && existingIdentity?.email === email) {
      const { error: resetError } = await supabase
        .from("player_identities")
        .update({ auth_user_id: null, claimed_at: null })
        .eq("player_id", playerId);
      if (resetError) throw resetError;
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/profile");
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
