import { describe, expect, it } from "vitest";

import { finishingPoints, votePoints } from "@/lib/points";

describe("points", () => {
  it("maps finishing position to MVP leaderboard points", () => {
    expect(finishingPoints(1)).toBe(10);
    expect(finishingPoints(2)).toBe(8);
    expect(finishingPoints(5)).toBe(5);
    expect(finishingPoints(9)).toBe(1);
    expect(finishingPoints(null)).toBe(0);
    expect(finishingPoints(10)).toBe(0);
  });

  it("maps vote rank to bonus points", () => {
    expect(votePoints(1)).toBe(6);
    expect(votePoints(2)).toBe(4);
    expect(votePoints(3)).toBe(2);
  });
});
