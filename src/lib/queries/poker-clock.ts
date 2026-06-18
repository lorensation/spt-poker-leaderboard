import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import { fallbackPokerClockState, normalizePokerClockState, POKER_CLOCK_ID, type PokerClockState } from "@/lib/poker-clock";
import { getPublicSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export async function getPokerClockState() {
  noStore();
  if (!isSupabaseConfigured()) return fallbackPokerClockState;

  const { data, error } = await getPublicSupabase()
    .from("poker_clock_state")
    .select("*")
    .eq("id", POKER_CLOCK_ID)
    .maybeSingle();

  if (error || !data) return fallbackPokerClockState;
  return normalizePokerClockState(data as unknown as Partial<PokerClockState>);
}
