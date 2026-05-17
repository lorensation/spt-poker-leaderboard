import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import type { LeaderboardKind, PlayerStats } from "@/lib/types";
import { getPublicSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

const PAGE_SIZE = 9;

export async function getLeaderboard({
  kind,
  page = 1,
  search = "",
}: {
  kind: LeaderboardKind;
  page?: number;
  search?: string;
}) {
  noStore();
  if (!isSupabaseConfigured()) {
    return { rows: [] as PlayerStats[], total: 0, page, pageSize: PAGE_SIZE };
  }

  const from = Math.max(0, page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const orderColumn = kind === "money" ? "money_rank" : "performance_rank";
  let query = getPublicSupabase()
    .from("player_stats_view")
    .select("*", { count: "exact" })
    .order(orderColumn, { ascending: true })
    .range(from, to);

  if (search.trim()) {
    query = query.ilike("nickname", `%${search.trim()}%`);
  }

  const { data, error, count } = await query;
  if (error) return { rows: [] as PlayerStats[], total: 0, page, pageSize: PAGE_SIZE };

  return {
    rows: (data ?? []) as PlayerStats[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function getTopPlayers(kind: LeaderboardKind, limit = 3) {
  noStore();
  if (!isSupabaseConfigured()) return [] as PlayerStats[];
  const orderColumn = kind === "money" ? "money_rank" : "performance_rank";
  const { data, error } = await getPublicSupabase()
    .from("player_stats_view")
    .select("*")
    .order(orderColumn, { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as PlayerStats[];
}
