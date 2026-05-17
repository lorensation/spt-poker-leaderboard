import { describe, expect, it } from "vitest";

import { parseGamePayload } from "@/lib/validation/game-results";

describe("parseGamePayload", () => {
  it("normalizes blank title and blank money fields", () => {
    const result = parseGamePayload({
      title: "",
      played_at: "2026-05-17",
      notes: "",
      results: [
        { player_id: "p1", finish_position: "1", money_spent: "", money_earned: "" },
        { player_id: "p2", finish_position: null, money_spent: "20", money_earned: "0" },
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.title).toBe("Poker Night - 2026-05-17");
    expect(result.data.results[0]).toMatchObject({
      finish_position: 1,
      money_spent: 0,
      money_earned: 0,
      finishing_points: 10,
    });
    expect(result.data.results[1]).toMatchObject({
      finish_position: null,
      money_spent: 20,
      money_earned: 0,
      finishing_points: 0,
    });
  });

  it("rejects invalid money, duplicate players, and duplicate qualified finishes", () => {
    expect(
      parseGamePayload({
        title: "Bad money",
        played_at: "2026-05-17",
        results: [
          { player_id: "p1", finish_position: "1", money_spent: "-1", money_earned: "0" },
          { player_id: "p2", finish_position: "2", money_spent: "0", money_earned: "0" },
        ],
      })
    ).toEqual({ success: false, message: "Money spent must be 0 or more." });

    expect(
      parseGamePayload({
        title: "Duplicate player",
        played_at: "2026-05-17",
        results: [
          { player_id: "p1", finish_position: "1", money_spent: "0", money_earned: "0" },
          { player_id: "p1", finish_position: "2", money_spent: "0", money_earned: "0" },
        ],
      })
    ).toEqual({ success: false, message: "Each selected player must be unique." });

    expect(
      parseGamePayload({
        title: "Duplicate finish",
        played_at: "2026-05-17",
        results: [
          { player_id: "p1", finish_position: "1", money_spent: "0", money_earned: "0" },
          { player_id: "p2", finish_position: "1", money_spent: "0", money_earned: "0" },
        ],
      })
    ).toEqual({ success: false, message: "Qualified finish positions must be unique." });
  });

  it("allows multiple not-qualified players", () => {
    const result = parseGamePayload({
      title: "NQ night",
      played_at: "2026-05-17",
      results: [
        { player_id: "p1", finish_position: "1", money_spent: "20", money_earned: "100" },
        { player_id: "p2", finish_position: null, money_spent: "20", money_earned: "0" },
        { player_id: "p3", finish_position: null, money_spent: "20", money_earned: "0" },
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.results.filter((row) => row.finish_position === null)).toHaveLength(2);
  });
});
