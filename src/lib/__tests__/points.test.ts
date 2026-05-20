import { describe, expect, it } from "vitest";

import { finishingPoints, finishingPointsByPosition, votePoints } from "@/lib/points";

describe("points", () => {
  it("maps finishing position to MVP leaderboard points", () => {
    expect(finishingPoints(1)).toBe(25);
    expect(finishingPoints(2)).toBe(20);
    expect(finishingPoints(3)).toBe(15);
    expect(finishingPoints(4)).toBe(10);
    expect(finishingPoints(5)).toBe(8);
    expect(finishingPoints(6)).toBe(6);
    expect(finishingPoints(7)).toBe(4);
    expect(finishingPoints(8)).toBe(2);
    expect(finishingPoints(9)).toBe(1);
    expect(finishingPoints(null)).toBe(0);
    expect(finishingPoints(10)).toBe(0);
  });

  it("subtracts tied group size from finishing points", () => {
    expect(finishingPoints(1, 3)).toBe(22);
    expect(finishingPoints(2, 2)).toBe(18);
    expect(finishingPointsByPosition([1, 1, 1])).toEqual([22, 22, 22]);
    expect(finishingPointsByPosition([1, 2, 2])).toEqual([25, 18, 18]);
    expect(finishingPointsByPosition([9, 9, null])).toEqual([0, 0, 0]);
  });

  it("maps vote rank to bonus points", () => {
    expect(votePoints(1)).toBe(6);
    expect(votePoints(2)).toBe(4);
    expect(votePoints(3)).toBe(2);
  });
});
