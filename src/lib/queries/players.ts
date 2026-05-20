import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import type { GameResult, Player, PlayerIdentity, PlayerStats, PlayerVoteHistory } from "@/lib/types";
import { getAdminSupabase, getPublicSupabase, isAdminSupabaseConfigured, isSupabaseConfigured } from "@/lib/supabase/server";

export async function getPlayers() {
  noStore();
  if (!isSupabaseConfigured()) return [] as Player[];
  const { data, error } = await getPublicSupabase()
    .from("players")
    .select("id,nickname,avatar_url,created_by_admin,created_at,updated_at")
    .order("nickname");
  if (error) return [];
  return (data ?? []) as Player[];
}

export async function getPlayerIdentities() {
  noStore();
  if (!isAdminSupabaseConfigured()) return [] as PlayerIdentity[];
  const { data, error } = await getAdminSupabase()
    .from("player_identities")
    .select("id,player_id,email,auth_user_id,claimed_at,created_at,updated_at")
    .order("email");
  if (error) return [];
  return (data ?? []) as PlayerIdentity[];
}

export async function getPlayerStatsByNickname(nickname: string) {
  noStore();
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getPublicSupabase()
    .from("player_stats_view")
    .select("*")
    .ilike("nickname", nickname)
    .maybeSingle();
  if (error) return null;
  return data as PlayerStats | null;
}

export async function getPlayerStatsById(playerId: string) {
  noStore();
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getPublicSupabase()
    .from("player_stats_view")
    .select("*")
    .eq("player_id", playerId)
    .maybeSingle();
  if (error) return null;
  return data as PlayerStats | null;
}

export async function getPlayerHistory(playerId: string) {
  noStore();
  if (!isSupabaseConfigured()) return [] as Array<GameResult & { games: { id: string; title: string; played_at: string } }>;
  const { data, error } = await getPublicSupabase()
    .from("game_results")
    .select("*, games(id,title,played_at)")
    .eq("player_id", playerId)
    .order("finish_position", { ascending: true });
  if (error) return [];
  return (data ?? []) as unknown as Array<GameResult & { games: { id: string; title: string; played_at: string } }>;
}

export async function getPlayerVoteHistory(playerId: string) {
  noStore();
  if (!isSupabaseConfigured()) return [] as PlayerVoteHistory[];
  const { data, error } = await getPublicSupabase()
    .from("game_votes")
    .select("*, games(id,title,played_at), voted_player:players!game_votes_voted_player_id_fkey(id,nickname,avatar_url)")
    .eq("voter_player_id", playerId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as PlayerVoteHistory[];
}

export async function searchPlayersAndGames(query: string) {
  noStore();
  if (!isSupabaseConfigured() || !query.trim()) return { players: [] as Player[], games: [] as Array<{ id: string; title: string; played_at: string }> };
  const supabase = getPublicSupabase();
  const [players, games] = await Promise.all([
    supabase.from("players").select("id,nickname,avatar_url").ilike("nickname", `%${query}%`).limit(8),
    supabase.from("games").select("id,title,played_at").ilike("title", `%${query}%`).limit(8),
  ]);
  return {
    players: (players.data ?? []) as Player[],
    games: (games.data ?? []) as Array<{ id: string; title: string; played_at: string }>,
  };
}
