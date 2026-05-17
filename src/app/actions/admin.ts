"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { finishingPoints } from "@/lib/points";
import { clearAdminSession, requireAdmin, setAdminSession, verifyAdminPassword } from "@/lib/security/admin";
import { getAdminSupabase } from "@/lib/supabase/server";
import type { GameStatus } from "@/lib/types";

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

type AdminResultInput = {
  player_id: string;
  finish_position: number;
  money_earned: number;
  buyins: number;
  rebuys: number;
  addon: boolean;
  notes?: string;
};

export async function createGameWithResults(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const playedAt = String(formData.get("played_at") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const resultsJson = String(formData.get("results") ?? "[]");
  const results = JSON.parse(resultsJson) as AdminResultInput[];

  if (!title || !playedAt || results.length < 2) {
    throw new Error("Game title, date, and at least two player results are required.");
  }

  const supabase = getAdminSupabase();
  const { data: game, error: gameError } = await supabase
    .from("games")
    .insert({ title, played_at: playedAt, notes, status: "voting_open" })
    .select("id")
    .single();

  if (gameError) throw new Error(gameError.message);

  const rows = results.map((result) => ({
    game_id: game.id,
    player_id: result.player_id,
    finish_position: Number(result.finish_position),
    money_earned: Number(result.money_earned || 0),
    buyins: Number(result.buyins || 0),
    rebuys: Number(result.rebuys || 0),
    addon: Boolean(result.addon),
    notes: result.notes || null,
    finishing_points: finishingPoints(Number(result.finish_position)),
  }));

  const { error: resultError } = await supabase.from("game_results").insert(rows);
  if (resultError) {
    await supabase.from("games").delete().eq("id", game.id);
    throw new Error(resultError.message);
  }

  revalidatePath("/");
  revalidatePath("/games");
  revalidatePath("/leaderboard/money");
  revalidatePath("/leaderboard/points");
  redirect(`/games/${game.id}`);
}

export async function deleteGame(formData: FormData) {
  await requireAdmin();
  const gameId = String(formData.get("gameId") ?? "");
  const { error } = await getAdminSupabase().from("games").delete().eq("id", gameId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/games");
  revalidatePath("/admin");
}

export async function setGameStatus(formData: FormData) {
  await requireAdmin();
  const gameId = String(formData.get("gameId") ?? "");
  const status = String(formData.get("status") ?? "draft") as GameStatus;
  const { error } = await getAdminSupabase().from("games").update({ status }).eq("id", gameId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/games");
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/admin");
}

export async function updateGameResult(formData: FormData) {
  await requireAdmin();
  const resultId = String(formData.get("resultId") ?? "");
  const gameId = String(formData.get("gameId") ?? "");
  const finishPosition = Number(formData.get("finish_position") ?? 0);
  const moneyEarned = Number(formData.get("money_earned") ?? 0);
  const buyins = Number(formData.get("buyins") ?? 0);
  const rebuys = Number(formData.get("rebuys") ?? 0);
  const addon = formData.get("addon") === "on";

  const { error } = await getAdminSupabase()
    .from("game_results")
    .update({
      finish_position: finishPosition,
      money_earned: moneyEarned,
      buyins,
      rebuys,
      addon,
      finishing_points: finishingPoints(finishPosition),
    })
    .eq("id", resultId);

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
  revalidatePath("/leaderboard/money");
  revalidatePath("/leaderboard/points");
}

export async function resetVotes(formData: FormData) {
  await requireAdmin();
  const gameId = String(formData.get("gameId") ?? "");
  const { error } = await getAdminSupabase().from("game_votes").delete().eq("game_id", gameId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/leaderboard/points");
}
