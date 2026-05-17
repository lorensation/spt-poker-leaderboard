"use server";

import { revalidatePath } from "next/cache";

import { logTransaction, safeErrorMessage } from "@/lib/logger";
import { votePoints } from "@/lib/points";
import { verifyEditToken } from "@/lib/security/tokens";
import { getAdminSupabase } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { validateVoteSelection } from "@/lib/votes";

export async function submitVotes(formData: FormData): Promise<ActionResult> {
  const gameId = String(formData.get("gameId") ?? "");
  const voterPlayerId = String(formData.get("voterPlayerId") ?? "");
  try {
    const editToken = String(formData.get("editToken") ?? "");
    const votedPlayerIds = [1, 2, 3].map((rank) => String(formData.get(`vote${rank}`) ?? ""));

    const validation = validateVoteSelection(voterPlayerId, votedPlayerIds);
    if (!validation.ok) {
      logTransaction({ operation: "submit_votes", success: false, payload: { gameId, voterPlayerId, reason: "validation" }, error: validation.error });
      return { success: false, message: validation.error };
    }

    const supabase = getAdminSupabase();
    const [{ data: game }, { data: voter }, existingVotes] = await Promise.all([
      supabase.from("games").select("status").eq("id", gameId).maybeSingle(),
      supabase.from("players").select("edit_token_hash").eq("id", voterPlayerId).maybeSingle(),
      supabase.from("game_votes").select("id").eq("game_id", gameId).eq("voter_player_id", voterPlayerId).limit(1),
    ]);

    if (!game || game.status !== "voting_open") return { success: false, message: "Voting is not open for this game." };
    if (!voter || !(await verifyEditToken(editToken, voter.edit_token_hash))) {
      return { success: false, message: "This browser cannot vote as that player." };
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
