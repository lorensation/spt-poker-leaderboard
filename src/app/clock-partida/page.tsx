import { PokerClockDisplay } from "@/components/poker-clock-display";
import { getPokerClockState } from "@/lib/queries/poker-clock";

export default async function PokerClockPage() {
  const state = await getPokerClockState();
  return <PokerClockDisplay initialState={state} />;
}
