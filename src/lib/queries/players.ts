import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import type { GameResult, Player, PlayerStats } from "@/lib/types";
import { getPublicSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export async function getPlayers() {
  noStore();
  if (!isSupabaseConfigured()) return [] as Player[];
  const { data, error } = await getPublicSupabase()
    .from("players")
    .select("id,nickname,avatar_url,created_at,updated_at")
    .order("nickname");
  if (error) return [];
  return (data ?? []) as Player[];
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
