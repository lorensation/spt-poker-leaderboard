import { describe, expect, it } from "vitest";

import { validateVoteSelection } from "@/lib/votes";

describe("validateVoteSelection", () => {
  it("accepts exactly three different non-self selections", () => {
    expect(validateVoteSelection("alex", ["bea", "chris", "dina"])).toEqual({
      ok: true,
    });
  });

  it("rejects missing selections, duplicate selections, and self votes", () => {
    expect(validateVoteSelection("alex", ["bea", "chris"])).toEqual({
      ok: false,
      error: "Choose exactly 3 performers.",
    });
    expect(validateVoteSelection("alex", ["bea", "bea", "chris"])).toEqual({
      ok: false,
      error: "Choose 3 different performers.",
    });
    expect(validateVoteSelection("alex", ["bea", "alex", "chris"])).toEqual({
      ok: false,
      error: "You cannot vote for yourself.",
    });
  });
});
