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
      finishing_points: 25,
    });
    expect(result.data.results[1]).toMatchObject({
      finish_position: null,
      money_spent: 20,
      money_earned: 0,
      finishing_points: 0,
    });
  });

  it("rejects invalid money and duplicate players", () => {
    expect(
      parseGamePayload({
        title: "Bad money",
        played_at: "2026-05-17",
        results: [
          { player_id: "p1", finish_position: "1", money_spent: "-1", money_earned: "0" },
          { player_id: "p2", finish_position: "2", money_spent: "0", money_earned: "0" },
        ],
      })
    ).toEqual({ success: false, message: "Money spent must be 0 or a multiple of 5." });

    expect(
      parseGamePayload({
        title: "Bad increment",
        played_at: "2026-05-17",
        results: [
          { player_id: "p1", finish_position: "1", money_spent: "29.98", money_earned: "0" },
          { player_id: "p2", finish_position: "2", money_spent: "0", money_earned: "0" },
        ],
      })
    ).toEqual({ success: false, message: "Money spent must be 0 or a multiple of 5." });

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

  });

  it("allows tied qualified finishes with a tied-group points penalty", () => {
    const threeFirsts = parseGamePayload({
      title: "Three way draw",
      played_at: "2026-05-17",
      results: [
        { player_id: "p1", finish_position: "1", money_spent: "0", money_earned: "0" },
        { player_id: "p2", finish_position: "1", money_spent: "0", money_earned: "0" },
        { player_id: "p3", finish_position: "1", money_spent: "0", money_earned: "0" },
      ],
    });

    expect(threeFirsts.success).toBe(true);
    if (!threeFirsts.success) return;
    expect(threeFirsts.data.results.map((result) => result.finishing_points)).toEqual([22, 22, 22]);

    const tiedSeconds = parseGamePayload({
      title: "Second place draw",
      played_at: "2026-05-17",
      results: [
        { player_id: "p1", finish_position: "1", money_spent: "0", money_earned: "0" },
        { player_id: "p2", finish_position: "2", money_spent: "0", money_earned: "0" },
        { player_id: "p3", finish_position: "2", money_spent: "0", money_earned: "0" },
      ],
    });

    expect(tiedSeconds.success).toBe(true);
    if (!tiedSeconds.success) return;
    expect(tiedSeconds.data.results.map((result) => result.finishing_points)).toEqual([25, 18, 18]);
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
