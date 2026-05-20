import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getAdminSupabase, createServerSupabase } from "@/lib/supabase/server";

export type CurrentPlayer = {
  user: User;
  playerId: string;
  email: string;
  claimedAt: string | null;
  player: {
    id: string;
    nickname: string;
    avatar_url: string | null;
  };
};

type IdentityWithPlayer = {
  player_id: string;
  email: string;
  claimed_at: string | null;
  players: {
    id: string;
    nickname: string;
    avatar_url: string | null;
  } | null;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return "http://localhost:3000";
}

export async function getCurrentPlayer(): Promise<CurrentPlayer | null> {
  const supabase = await createServerSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) return null;

  const { data, error } = await getAdminSupabase()
    .from("player_identities")
    .select("player_id,email,claimed_at,players(id,nickname,avatar_url)")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  const identity = data as unknown as IdentityWithPlayer;
  if (!identity.players) return null;

  return {
    user,
    playerId: identity.player_id,
    email: identity.email,
    claimedAt: identity.claimed_at,
    player: identity.players,
  };
}

export async function requireCurrentPlayer() {
  const currentPlayer = await getCurrentPlayer();
  if (!currentPlayer) {
    redirect("/identify");
  }
  return currentPlayer;
}

export async function completePlayerIdentityLink() {
  const supabase = await createServerSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  const email = normalizeEmail(user?.email ?? "");

  if (userError || !user || !email) {
    return { success: false, message: "The sign-in link is invalid or expired." };
  }

  const admin = getAdminSupabase();
  const { data: identity, error: identityError } = await admin
    .from("player_identities")
    .select("player_id,auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (identityError) throw identityError;
  if (!identity) {
    await supabase.auth.signOut();
    return { success: false, message: "No player is linked to this email. Contact the admin." };
  }

  if (identity.auth_user_id && identity.auth_user_id !== user.id) {
    await supabase.auth.signOut();
    return { success: false, message: "This player identity is already linked to another account." };
  }

  const { error: updateError } = await admin
    .from("player_identities")
    .update({ auth_user_id: user.id, claimed_at: new Date().toISOString() })
    .eq("player_id", identity.player_id)
    .or(`auth_user_id.is.null,auth_user_id.eq.${user.id}`);

  if (updateError) throw updateError;
  return { success: true, message: "Player identity linked.", playerId: identity.player_id as string };
}
