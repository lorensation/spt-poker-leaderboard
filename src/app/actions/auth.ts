"use server";

import { redirect } from "next/navigation";

import { logTransaction, safeErrorMessage } from "@/lib/logger";
import { completePlayerIdentityLink, getCurrentPlayer, getSiteUrl, normalizeEmail } from "@/lib/auth/player";
import { createServerSupabase, getAdminSupabase } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

export async function identifyPlayer(formData: FormData): Promise<ActionResult> {
  const playerId = String(formData.get("playerId") ?? "");
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  try {
    if (!playerId || !email || !email.includes("@")) {
      return { success: false, message: "Select your player name and enter your email." };
    }

    const admin = getAdminSupabase();
    const { data: identity, error } = await admin
      .from("player_identities")
      .select("player_id,email,auth_user_id")
      .eq("player_id", playerId)
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    if (!identity) {
      return { success: false, message: "That email is not linked to this player. Contact the admin." };
    }

    await ensureAuthUserForPlayerIdentity({
      playerId: identity.player_id,
      email,
      authUserId: identity.auth_user_id,
    });

    const supabase = await createServerSupabase();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/profile`,
        shouldCreateUser: false,
      },
    });

    if (signInError) throw signInError;

    logTransaction({ operation: "identify_player", success: true, payload: { playerId, email } });
    return { success: true, message: "Check your email for the sign-in link." };
  } catch (error) {
    logTransaction({ operation: "identify_player", success: false, payload: { playerId, email }, error });
    return { success: false, message: "Could not send the sign-in link.", error: safeErrorMessage(error) };
  }
}

export async function linkCurrentAuthUserToPlayer() {
  const result = await completePlayerIdentityLink();
  if (result.success) {
    logTransaction({ operation: "link_player_identity", success: true, payload: { playerId: result.playerId } });
  }
  return result;
}

export async function logoutPlayer() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/identify");
}

export async function redirectAuthenticatedPlayer() {
  const currentPlayer = await getCurrentPlayer();
  if (currentPlayer) redirect("/profile");
}

async function ensureAuthUserForPlayerIdentity({
  playerId,
  email,
  authUserId,
}: {
  playerId: string;
  email: string;
  authUserId: string | null;
}) {
  const admin = getAdminSupabase();

  if (authUserId) {
    const { error } = await admin.auth.admin.updateUserById(authUserId, { email_confirm: true });
    if (error) throw error;
    return;
  }

  const createResult = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { player_id: playerId, source: "spt-poker-leaderboard" },
  });

  if (createResult.data.user) {
    const { error } = await admin
      .from("player_identities")
      .update({ auth_user_id: createResult.data.user.id })
      .eq("player_id", playerId);
    if (error) throw error;
    return;
  }

  const createErrorMessage = createResult.error?.message ?? "";
  if (!/already|registered|exists/i.test(createErrorMessage)) {
    throw createResult.error ?? new Error("Could not prepare player login.");
  }

  const existingUser = await findAuthUserByEmail(email);
  if (!existingUser) {
    throw createResult.error ?? new Error("Could not find the existing auth user.");
  }

  const { error: confirmError } = await admin.auth.admin.updateUserById(existingUser.id, {
    email_confirm: true,
    user_metadata: { ...(existingUser.user_metadata ?? {}), player_id: playerId, source: "spt-poker-leaderboard" },
  });
  if (confirmError) throw confirmError;

  const { error: identityError } = await admin
    .from("player_identities")
    .update({ auth_user_id: existingUser.id })
    .eq("player_id", playerId);
  if (identityError) throw identityError;
}

async function findAuthUserByEmail(email: string) {
  const admin = getAdminSupabase();

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((candidate) => normalizeEmail(candidate.email ?? "") === email);
    if (user) return user;
    if (!data.nextPage) return null;
  }

  return null;
}
