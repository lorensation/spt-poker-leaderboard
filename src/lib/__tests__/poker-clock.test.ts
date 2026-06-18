import { describe, expect, it } from "vitest";

import {
  applyClockControl,
  formatClockTime,
  formatPokerLevel,
  normalizePokerClockLevels,
  pokerClockStats,
  remainingSecondsForState,
  type PokerClockState,
} from "@/lib/poker-clock";

const baseState: PokerClockState = {
  id: "default",
  levels: [
    { type: "blind", durationSeconds: 1200, smallBlind: 200, bigBlind: 400, ante: 200 },
    { type: "break", durationSeconds: 600, label: "BREAK" },
    { type: "blind", durationSeconds: 1200, smallBlind: 500, bigBlind: 1000, ante: 500 },
  ],
  current_level_index: 0,
  status: "idle",
  started_at: null,
  paused_remaining_seconds: null,
  entries: 24,
  remaining_players: 8,
  buy_in_stack: 10000,
  entry_price: 10,
};

describe("poker clock", () => {
  it("calculates tournament stats", () => {
    expect(pokerClockStats(baseState)).toEqual({
      totalChips: 240000,
      averageStack: 30000,
      prizePool: 240,
    });
  });

  it("formats blind and break levels", () => {
    expect(formatPokerLevel(baseState.levels[0])).toBe("200 / 400 / 200");
    expect(formatPokerLevel(baseState.levels[1])).toBe("BREAK");
  });

  it("defaults missing ante to the small blind for existing levels", () => {
    const levels = normalizePokerClockLevels([{ type: "blind", durationSeconds: 1200, smallBlind: 200, bigBlind: 400 }]);
    expect(formatPokerLevel(levels[0])).toBe("200 / 400 / 200");
  });

  it("derives remaining seconds from running state", () => {
    const now = new Date("2026-06-18T10:05:00.000Z").getTime();
    expect(
      remainingSecondsForState(
        {
          ...baseState,
          status: "running",
          started_at: "2026-06-18T10:00:00.000Z",
        },
        now
      )
    ).toBe(900);
  });

  it("preserves remaining time when paused and resumed", () => {
    const paused = applyClockControl(
      {
        ...baseState,
        status: "running",
        started_at: "2026-06-18T10:00:00.000Z",
      },
      "pause",
      new Date("2026-06-18T10:05:00.000Z")
    );
    expect(paused.status).toBe("paused");
    expect(paused.paused_remaining_seconds).toBe(900);

    const resumed = applyClockControl(paused, "resume", new Date("2026-06-18T10:10:00.000Z"));
    expect(resumed.status).toBe("running");
    expect(remainingSecondsForState(resumed, new Date("2026-06-18T10:10:00.000Z").getTime())).toBe(900);
  });

  it("moves between levels without auto-advancing", () => {
    const next = applyClockControl(baseState, "next");
    expect(next.current_level_index).toBe(1);
    expect(next.status).toBe("idle");
    expect(remainingSecondsForState(next)).toBe(600);

    const previous = applyClockControl(next, "previous");
    expect(previous.current_level_index).toBe(0);
  });

  it("formats countdown text", () => {
    expect(formatClockTime(1200)).toBe("20:00");
    expect(formatClockTime(5)).toBe("0:05");
    expect(formatClockTime(-1)).toBe("0:00");
  });
});
