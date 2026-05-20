"use server";

import { revalidatePath } from "next/cache";

import { getCurrentPlayer } from "@/lib/auth/player";
import { logTransaction, safeErrorMessage } from "@/lib/logger";
import { votePoints } from "@/lib/points";
import { getAdminSupabase } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { validateVoteSelection } from "@/lib/votes";

export async function submitVotes(formData: FormData): Promise<ActionResult> {
  const gameId = String(formData.get("gameId") ?? "");
  let voterPlayerId = "";
  try {
    const currentPlayer = await getCurrentPlayer();
    if (!currentPlayer) {
      return { success: false, message: "Sign in as your player before voting." };
    }
    voterPlayerId = currentPlayer.playerId;
    const votedPlayerIds = [1, 2, 3].map((rank) => String(formData.get(`vote${rank}`) ?? ""));

    const validation = validateVoteSelection(voterPlayerId, votedPlayerIds);
    if (!validation.ok) {
      logTransaction({ operation: "submit_votes", success: false, payload: { gameId, voterPlayerId, reason: "validation" }, error: validation.error });
      return { success: false, message: validation.error };
    }

    const supabase = getAdminSupabase();
    const [{ data: game }, existingVotes, participants] = await Promise.all([
      supabase.from("games").select("status").eq("id", gameId).maybeSingle(),
      supabase.from("game_votes").select("id").eq("game_id", gameId).eq("voter_player_id", voterPlayerId).limit(1),
      supabase.from("game_results").select("player_id").eq("game_id", gameId),
    ]);

    if (!game || game.status !== "voting_open") return { success: false, message: "Voting is not open for this game." };
    const participantIds = new Set((participants.data ?? []).map((participant) => participant.player_id as string));
    if (!participantIds.has(voterPlayerId)) {
      return { success: false, message: "Only players in this game can vote." };
    }
    if (votedPlayerIds.some((playerId) => !participantIds.has(playerId))) {
      return { success: false, message: "Votes must be for players in this game." };
    }
    if ((existingVotes.data ?? []).length > 0) {
      return { success: false, message: "That player already voted for this game." };
    }

    const rows = votedPlayerIds.map((playerId, index) => {
      const rank = (index + 1) as 1 | 2 | 3;
      return {
        game_id: gameId,
        voter_player_id: voterPlayerId,
        voted_player_id: playerId,
        vote_rank: rank,
        points_awarded: votePoints(rank),
      };
    });

    const { error } = await supabase.from("game_votes").insert(rows);
    if (error) throw error;

    revalidatePath("/");
    revalidatePath("/games");
    revalidatePath(`/games/${gameId}`);
    revalidatePath(`/vote/${gameId}`);
    revalidatePath("/leaderboard/points");
    logTransaction({ operation: "submit_votes", success: true, payload: { gameId, voterPlayerId, voteCount: rows.length } });
    return { success: true, message: "Votes submitted." };
  } catch (error) {
    logTransaction({ operation: "submit_votes", success: false, payload: { gameId, voterPlayerId }, error });
    return { success: false, message: "Could not submit votes.", error: safeErrorMessage(error) };
  }
}
