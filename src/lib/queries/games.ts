import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import type { Game, GameCardData, GameDetailData, GameResult, GameVote, Player } from "@/lib/types";
import { getPublicSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

type ResultWithPlayer = GameResult & { players: Player };

export async function getGames() {
  noStore();
  if (!isSupabaseConfigured()) return [] as GameCardData[];
  const { data, error } = await getPublicSupabase()
    .from("games")
    .select("*, game_results(*, players(id,nickname,avatar_url))")
    .order("played_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((game) => normalizeGameCard(game as unknown as Game & { game_results: ResultWithPlayer[] }));
}

export async function getLatestOpenGame() {
  noStore();
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getPublicSupabase()
    .from("games")
    .select("*")
    .eq("status", "voting_open")
    .order("played_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as Game | null;
}

export async function getGameDetail(id: string) {
  noStore();
  if (!isSupabaseConfigured()) return null;
  const supabase = getPublicSupabase();
  const [gameResponse, votesResponse] = await Promise.all([
    supabase
      .from("games")
      .select("*, game_results(*, players(id,nickname,avatar_url))")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("game_votes")
      .select("*, voted_player:players!game_votes_voted_player_id_fkey(id,nickname,avatar_url), voter_player:players!game_votes_voter_player_id_fkey(id,nickname,avatar_url)")
      .eq("game_id", id),
  ]);

  if (gameResponse.error || !gameResponse.data) return null;

  const card = normalizeGameCard(gameResponse.data as unknown as Game & { game_results: ResultWithPlayer[] });
  const votes = (votesResponse.data ?? []) as unknown as Array<GameVote & { voted_player?: Player; voter_player?: Player }>;
  const totals = new Map<string, { player: Player; points: number; firsts: number }>();

  for (const vote of votes) {
    if (!vote.voted_player) continue;
    const current = totals.get(vote.voted_player.id) ?? {
      player: vote.voted_player,
      points: 0,
      firsts: 0,
    };
    current.points += Number(vote.points_awarded);
    current.firsts += vote.vote_rank === 1 ? 1 : 0;
    totals.set(vote.voted_player.id, current);
  }

  const voteTotals = Array.from(totals.values()).sort(
    (a, b) => b.points - a.points || b.firsts - a.firsts || a.player.nickname.localeCompare(b.player.nickname)
  );

  return {
    ...card,
    results: sortResults((gameResponse.data as unknown as { game_results: ResultWithPlayer[] }).game_results ?? []),
    votes,
    vote_totals: voteTotals,
    mvp: voteTotals[0] ?? null,
  } satisfies GameDetailData;
}

export async function hasPlayerVoted(gameId: string, playerId: string) {
  noStore();
  if (!isSupabaseConfigured()) return false;
  const { data, error } = await getPublicSupabase()
    .from("game_votes")
    .select("id")
    .eq("game_id", gameId)
    .eq("voter_player_id", playerId)
    .limit(1);
  if (error) return false;
  return (data ?? []).length > 0;
}

function normalizeGameCard(game: Game & { game_results?: ResultWithPlayer[] }): GameCardData {
  const results = sortResults(game.game_results ?? []);
  const totalSpent = results.reduce((sum, result) => sum + Math.max(0, Number(result.money_spent ?? 0)), 0);
  const totalEarned = results.reduce((sum, result) => sum + Math.max(0, Number(result.money_earned ?? 0)), 0);
  const totalPot = totalSpent > 0 ? totalSpent : totalEarned;
  return {
    id: game.id,
    title: game.title,
    played_at: game.played_at,
    status: game.status,
    notes: game.notes,
    created_at: game.created_at,
    updated_at: game.updated_at,
    player_count: results.length,
    total_pot: totalPot,
    winner: results[0]?.players ?? null,
    top_three: results.slice(0, 3),
  };
}

function sortResults<T extends { finish_position: number | null }>(results: T[]) {
  return [...results].sort((a, b) => {
    if (a.finish_position === null && b.finish_position === null) return 0;
    if (a.finish_position === null) return 1;
    if (b.finish_position === null) return -1;
    return a.finish_position - b.finish_position;
  });
}
