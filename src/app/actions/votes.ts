"use server";

import { revalidatePath } from "next/cache";

import { votePoints } from "@/lib/points";
import { verifyEditToken } from "@/lib/security/tokens";
import { getAdminSupabase } from "@/lib/supabase/server";
import { validateVoteSelection } from "@/lib/votes";

export type VoteActionState = { ok: boolean; message: string };

export async function submitVotes(formData: FormData): Promise<VoteActionState> {
  try {
    const gameId = String(formData.get("gameId") ?? "");
    const voterPlayerId = String(formData.get("voterPlayerId") ?? "");
    const editToken = String(formData.get("editToken") ?? "");
    const votedPlayerIds = [1, 2, 3].map((rank) => String(formData.get(`vote${rank}`) ?? ""));

    const validation = validateVoteSelection(voterPlayerId, votedPlayerIds);
    if (!validation.ok) return { ok: false, message: validation.error };

    const supabase = getAdminSupabase();
    const [{ data: game }, { data: voter }, existingVotes] = await Promise.all([
      supabase.from("games").select("status").eq("id", gameId).maybeSingle(),
      supabase.from("players").select("edit_token_hash").eq("id", voterPlayerId).maybeSingle(),
      supabase.from("game_votes").select("id").eq("game_id", gameId).eq("voter_player_id", voterPlayerId).limit(1),
    ]);

    if (!game || game.status !== "voting_open") return { ok: false, message: "Voting is not open for this game." };
    if (!voter || !(await verifyEditToken(editToken, voter.edit_token_hash))) {
      return { ok: false, message: "This browser cannot vote as that player." };
    }
    if ((existingVotes.data ?? []).length > 0) {
      return { ok: false, message: "That player already voted for this game." };
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
    if (error) return { ok: false, message: error.message };

    revalidatePath("/");
    revalidatePath(`/games/${gameId}`);
    revalidatePath(`/vote/${gameId}`);
    revalidatePath("/leaderboard/points");
    return { ok: true, message: "Votes submitted." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not submit votes." };
  }
}
