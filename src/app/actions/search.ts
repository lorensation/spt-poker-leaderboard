"use server";

import { searchPlayersAndGames } from "@/lib/queries/players";

export async function searchPlayersAndGamesAction(query: string) {
  return searchPlayersAndGames(query);
}
