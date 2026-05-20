"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { finishingPointsByPosition } from "@/lib/points";
import { logTransaction, safeErrorMessage } from "@/lib/logger";
import { clearAdminSession, requireAdmin, setAdminSession, verifyAdminPassword } from "@/lib/security/admin";
import { getAdminSupabase } from "@/lib/supabase/server";
import type { ActionResult, GameStatus } from "@/lib/types";
import { parseGamePayloadFromFormData, parseMoneyAmount } from "@/lib/validation/game-results";

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!verifyAdminPassword(password)) {
    redirect("/admin?error=1");
  }
  await setAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin");
}

export async function createGameWithResults(formData: FormData): Promise<ActionResult<{ gameId: string }>> {
  const validation = parseGamePayloadFromFormData(formData);
  if (!validation.success) {
    logTransaction({
      operation: "create_game",
      success: false,
      payload: { reason: "validation" },
      error: validation.message,
    });
    return { success: false, message: validation.message };
  }

  const { title, played_at: playedAt, notes, results } = validation.data;
  let gameId: string | null = null;

  try {
    await requireAdmin();
    const supabase = getAdminSupabase();
    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({ title, played_at: playedAt, notes, status: "voting_open" })
      .select("id")
      .single();

    if (gameError) throw gameError;
    gameId = game.id;

    const rows = results.map((result) => ({
      game_id: game.id,
      player_id: result.player_id,
      finish_position: result.finish_position,
      money_spent: result.money_spent,
      money_earned: result.money_earned,
      finishing_points: result.finishing_points,
      notes: null,
    }));

    const { error: resultError } = await supabase.from("game_results").insert(rows);
    if (resultError) {
      const cleanup = await supabase.from("games").delete().eq("id", game.id);
      if (cleanup.error) {
        logTransaction({
          operation: "create_game_cleanup",
          success: false,
          payload: { gameId: game.id },
          error: cleanup.error,
        });
      }
      throw resultError;
    }

    revalidateGamePaths(game.id);
    logTransaction({
      operation: "create_game",
      success: true,
      payload: { gameId: game.id, playerCount: results.length, playedAt },
    });
    return { success: true, message: "Game created and voting opened.", data: { gameId: game.id } };
  } catch (error) {
    logTransaction({
      operation: "create_game",
      success: false,
      payload: { gameId, playerCount: results.length, playedAt },
      error,
    });
    return { success: false, message: "Could not create game. Please check the player results.", error: safeErrorMessage(error) };
  }
}

export async function deleteGame(formData: FormData): Promise<ActionResult> {
  const gameId = String(formData.get("gameId") ?? "");
  try {
    await requireAdmin();
    const { error } = await getAdminSupabase().from("games").delete().eq("id", gameId);
    if (error) throw error;
    revalidateGamePaths(gameId);
    logTransaction({ operation: "delete_game", success: true, payload: { gameId } });
    return { success: true, message: "Game deleted." };
  } catch (error) {
    logTransaction({ operation: "delete_game", success: false, payload: { gameId }, error });
    return { success: false, message: "Could not delete game.", error: safeErrorMessage(error) };
  }
}

export async function setGameStatus(formData: FormData): Promise<ActionResult> {
  const gameId = String(formData.get("gameId") ?? "");
  const status = String(formData.get("status") ?? "draft") as GameStatus;
  try {
    await requireAdmin();
    const { error } = await getAdminSupabase().from("games").update({ status }).eq("id", gameId);
    if (error) throw error;
    revalidateGamePaths(gameId);
    logTransaction({ operation: "set_game_status", success: true, payload: { gameId, status } });
    return { success: true, message: "Voting status updated." };
  } catch (error) {
    logTransaction({ operation: "set_game_status", success: false, payload: { gameId, status }, error });
    return { success: false, message: "Could not update voting status.", error: safeErrorMessage(error) };
  }
}

export async function updateGameResult(formData: FormData): Promise<ActionResult> {
  const resultId = String(formData.get("resultId") ?? "");
  const gameId = String(formData.get("gameId") ?? "");
  const finishValue = String(formData.get("finish_position") ?? "");
  const finishPosition = finishValue === "nq" || finishValue === "null" ? null : Number(finishValue);
  const moneySpent = normalizeMoneyFormValue(formData.get("money_spent"));
  const moneyEarned = normalizeMoneyFormValue(formData.get("money_earned"));

  if (moneySpent === null || moneyEarned === null || (finishPosition !== null && (!Number.isInteger(finishPosition) || finishPosition < 1 || finishPosition > 9))) {
    return { success: false, message: "Result values are invalid." };
  }

  try {
    await requireAdmin();
    const supabase = getAdminSupabase();
    const { data: currentResults, error: currentResultsError } = await supabase
      .from("game_results")
      .select("id,finish_position")
      .eq("game_id", gameId);
    if (currentResultsError) throw currentResultsError;

    const updatedResults = (currentResults ?? []).map((result) => ({
      id: result.id as string,
      finish_position: result.id === resultId ? finishPosition : (result.finish_position as number | null),
    }));
    const targetIndex = updatedResults.findIndex((result) => result.id === resultId);
    if (targetIndex === -1) return { success: false, message: "Game result not found." };
    const points = finishingPointsByPosition(updatedResults.map((result) => result.finish_position));

    const { error } = await supabase
      .from("game_results")
      .update({
        finish_position: finishPosition,
        money_spent: moneySpent,
        money_earned: moneyEarned,
        finishing_points: points[targetIndex] ?? 0,
      })
      .eq("id", resultId);

    if (error) throw error;

    for (const [index, result] of updatedResults.entries()) {
      if (result.id === resultId) continue;
      const { error: pointsError } = await supabase
        .from("game_results")
        .update({ finishing_points: points[index] ?? 0 })
        .eq("id", result.id);
      if (pointsError) throw pointsError;
    }

    revalidateGamePaths(gameId);
    logTransaction({ operation: "update_game_result", success: true, payload: { gameId, resultId } });
    return { success: true, message: "Game result updated." };
  } catch (error) {
    logTransaction({ operation: "update_game_result", success: false, payload: { gameId, resultId }, error });
    return { success: false, message: "Could not update game result.", error: safeErrorMessage(error) };
  }
}

export async function resetVotes(formData: FormData): Promise<ActionResult> {
  const gameId = String(formData.get("gameId") ?? "");
  try {
    await requireAdmin();
    const { error } = await getAdminSupabase().from("game_votes").delete().eq("game_id", gameId);
    if (error) throw error;
    revalidateGamePaths(gameId);
    logTransaction({ operation: "reset_votes", success: true, payload: { gameId } });
    return { success: true, message: "Votes reset." };
  } catch (error) {
    logTransaction({ operation: "reset_votes", success: false, payload: { gameId }, error });
    return { success: false, message: "Could not reset votes.", error: safeErrorMessage(error) };
  }
}

function revalidateGamePaths(gameId: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/games");
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/leaderboard/money");
  revalidatePath("/leaderboard/points");
}

function normalizeMoneyFormValue(value: FormDataEntryValue | null) {
  return parseMoneyAmount(value);
}
