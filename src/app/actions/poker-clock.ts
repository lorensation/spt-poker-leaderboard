"use server";

import { revalidatePath } from "next/cache";

import {
  applyClockControl,
  fallbackPokerClockState,
  normalizePokerClockState,
  POKER_CLOCK_ID,
  validatePokerClockStateInput,
  type PokerClockState,
} from "@/lib/poker-clock";
import { getPokerClockState } from "@/lib/queries/poker-clock";
import { logTransaction, safeErrorMessage } from "@/lib/logger";
import { requireAdmin } from "@/lib/security/admin";
import { getAdminSupabase } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

type ClockControl = "start" | "pause" | "resume" | "reset" | "next" | "previous";

export async function savePokerClockConfiguration(formData: FormData): Promise<ActionResult> {
  const validation = validatePokerClockStateInput({
    levels: parseJson(formData.get("levels")),
    entries: formData.get("entries"),
    remaining_players: formData.get("remaining_players"),
    buy_in_stack: formData.get("buy_in_stack"),
    entry_price: formData.get("entry_price"),
  });

  if (!validation.success) {
    return { success: false, message: validation.message };
  }

  try {
    await requireAdmin();
    const current = await getPokerClockStateForAdmin();
    const currentIndex = Math.min(current.current_level_index, validation.data.levels.length - 1);
    const { error } = await getAdminSupabase()
      .from("poker_clock_state")
      .upsert({
        id: POKER_CLOCK_ID,
        levels: validation.data.levels,
        current_level_index: currentIndex,
        entries: validation.data.entries,
        remaining_players: validation.data.remaining_players,
        buy_in_stack: validation.data.buy_in_stack,
        entry_price: validation.data.entry_price,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    revalidateClockPaths();
    logTransaction({ operation: "save_poker_clock_configuration", success: true, payload: { levels: validation.data.levels.length } });
    return { success: true, message: "Poker clock configuration saved." };
  } catch (error) {
    logTransaction({ operation: "save_poker_clock_configuration", success: false, error });
    return { success: false, message: "Could not save poker clock configuration.", error: safeErrorMessage(error) };
  }
}

export async function controlPokerClock(formData: FormData): Promise<ActionResult> {
  const control = String(formData.get("control") ?? "") as ClockControl;
  if (!["start", "pause", "resume", "reset", "next", "previous"].includes(control)) {
    return { success: false, message: "Clock control is invalid." };
  }

  try {
    await requireAdmin();
    const current = await getPokerClockStateForAdmin();
    const updated = applyClockControl(current, control);
    const { error } = await getAdminSupabase()
      .from("poker_clock_state")
      .upsert({
        id: POKER_CLOCK_ID,
        current_level_index: updated.current_level_index,
        status: updated.status,
        started_at: updated.started_at,
        paused_remaining_seconds: updated.paused_remaining_seconds,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    revalidateClockPaths();
    logTransaction({ operation: "control_poker_clock", success: true, payload: { control } });
    return { success: true, message: clockControlMessage(control) };
  } catch (error) {
    logTransaction({ operation: "control_poker_clock", success: false, payload: { control }, error });
    return { success: false, message: "Could not update poker clock.", error: safeErrorMessage(error) };
  }
}

async function getPokerClockStateForAdmin() {
  try {
    const { data, error } = await getAdminSupabase()
      .from("poker_clock_state")
      .select("*")
      .eq("id", POKER_CLOCK_ID)
      .maybeSingle();
    if (error || !data) return fallbackPokerClockState;
    return normalizePokerClockState(data as unknown as Partial<PokerClockState>);
  } catch {
    return getPokerClockState();
  }
}

function parseJson(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function clockControlMessage(control: ClockControl) {
  return {
    start: "Poker clock started.",
    pause: "Poker clock paused.",
    resume: "Poker clock resumed.",
    reset: "Current level reset.",
    next: "Moved to next level.",
    previous: "Moved to previous level.",
  }[control];
}

function revalidateClockPaths() {
  revalidatePath("/clock-partida");
  revalidatePath("/admin/clock-partida");
}
