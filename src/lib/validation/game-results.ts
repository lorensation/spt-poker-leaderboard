import { finishingPointsByPosition } from "@/lib/points";

export type RawGameResultInput = {
  player_id?: unknown;
  finish_position?: unknown;
  money_spent?: unknown;
  money_earned?: unknown;
};

export type RawGamePayload = {
  title?: unknown;
  played_at?: unknown;
  notes?: unknown;
  results?: unknown;
};

export type ParsedGameResult = {
  player_id: string;
  finish_position: number | null;
  money_spent: number;
  money_earned: number;
  finishing_points: number;
};

export type ParsedGamePayload = {
  title: string;
  played_at: string;
  notes: string | null;
  results: ParsedGameResult[];
};

export type ValidationResult<T> = { success: true; data: T } | { success: false; message: string };

export function parseGamePayload(input: RawGamePayload): ValidationResult<ParsedGamePayload> {
  const playedAt = String(input.played_at ?? "").trim();
  if (!playedAt) return { success: false, message: "Game date is required." };

  const rawResults = Array.isArray(input.results) ? (input.results as RawGameResultInput[]) : [];
  if (rawResults.length < 2) return { success: false, message: "Add at least 2 players." };

  const playerIds = new Set<string>();
  const results: Omit<ParsedGameResult, "finishing_points">[] = [];

  for (const raw of rawResults) {
    const playerId = String(raw.player_id ?? "").trim();
    if (!playerId) return { success: false, message: "Each row needs a player." };
    if (playerIds.has(playerId)) return { success: false, message: "Each selected player must be unique." };
    playerIds.add(playerId);

    const finish = parseFinishPosition(raw.finish_position);
    if (finish === "invalid") return { success: false, message: "Each player needs a finish position or Not qualified." };

    const moneySpent = parseMoneyAmount(raw.money_spent);
    if (moneySpent === null) return { success: false, message: "Money spent must be 0 or a multiple of 5." };
    const moneyEarned = parseMoneyAmount(raw.money_earned);
    if (moneyEarned === null) return { success: false, message: "Money earned must be 0 or a multiple of 5." };

    results.push({
      player_id: playerId,
      finish_position: finish,
      money_spent: moneySpent,
      money_earned: moneyEarned,
    });
  }

  const title = String(input.title ?? "").trim() || `Poker Night - ${playedAt}`;
  const notes = String(input.notes ?? "").trim() || null;
  const points = finishingPointsByPosition(results.map((result) => result.finish_position));
  const resultsWithPoints = results.map((result, index) => ({
    ...result,
    finishing_points: points[index],
  }));

  return { success: true, data: { title, played_at: playedAt, notes, results: resultsWithPoints } };
}

export function parseGamePayloadFromFormData(formData: FormData): ValidationResult<ParsedGamePayload> {
  let results: unknown = [];
  try {
    results = JSON.parse(String(formData.get("results") ?? "[]"));
  } catch {
    return { success: false, message: "Player results are not valid." };
  }

  return parseGamePayload({
    title: formData.get("title"),
    played_at: formData.get("played_at"),
    notes: formData.get("notes"),
    results,
  });
}

function parseFinishPosition(value: unknown): number | null | "invalid" {
  if (value === null || value === "null" || value === "nq") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9) return "invalid";
  return parsed;
}

export function parseMoneyAmount(value: unknown) {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  const cents = Math.round(parsed * 100);
  if (Math.abs(parsed * 100 - cents) > 0.000001) return null;
  if (cents % 500 !== 0) return null;
  return cents / 100;
}
