export type VoteValidationResult = { ok: true } | { ok: false; error: string };

export function validateVoteSelection(voterId: string, votedPlayerIds: string[]): VoteValidationResult {
  const selected = votedPlayerIds.filter(Boolean);

  if (selected.length !== 3) {
    return { ok: false, error: "Choose exactly 3 performers." };
  }

  if (new Set(selected).size !== 3) {
    return { ok: false, error: "Choose 3 different performers." };
  }

  if (selected.includes(voterId)) {
    return { ok: false, error: "You cannot vote for yourself." };
  }

  return { ok: true };
}
