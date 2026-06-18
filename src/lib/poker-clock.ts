export const POKER_CLOCK_ID = "default";
export const POKER_CLOCK_POLL_INTERVAL_MS = 12_000;

export type PokerClockStatus = "idle" | "running" | "paused";

export type PokerClockBlindLevel = {
  type: "blind";
  durationSeconds: number;
  smallBlind: number;
  bigBlind: number;
};

export type PokerClockBreakLevel = {
  type: "break";
  durationSeconds: number;
  label: string;
};

export type PokerClockLevel = PokerClockBlindLevel | PokerClockBreakLevel;

export type PokerClockState = {
  id: string;
  levels: PokerClockLevel[];
  current_level_index: number;
  status: PokerClockStatus;
  started_at: string | null;
  paused_remaining_seconds: number | null;
  entries: number;
  remaining_players: number;
  buy_in_stack: number;
  entry_price: number;
  created_at?: string;
  updated_at?: string;
};

export type PokerClockDerivedStats = {
  totalChips: number;
  averageStack: number;
  prizePool: number;
};

export const defaultPokerClockLevels: PokerClockLevel[] = [
  { type: "blind", durationSeconds: 20 * 60, smallBlind: 100, bigBlind: 200 },
  { type: "blind", durationSeconds: 20 * 60, smallBlind: 200, bigBlind: 400 },
  { type: "blind", durationSeconds: 20 * 60, smallBlind: 300, bigBlind: 600 },
  { type: "break", durationSeconds: 10 * 60, label: "BREAK" },
  { type: "blind", durationSeconds: 20 * 60, smallBlind: 500, bigBlind: 1000 },
  { type: "blind", durationSeconds: 20 * 60, smallBlind: 1000, bigBlind: 2000 },
];

export const fallbackPokerClockState: PokerClockState = {
  id: POKER_CLOCK_ID,
  levels: defaultPokerClockLevels,
  current_level_index: 0,
  status: "idle",
  started_at: null,
  paused_remaining_seconds: null,
  entries: 0,
  remaining_players: 0,
  buy_in_stack: 10000,
  entry_price: 10,
};

export function normalizePokerClockState(value: Partial<PokerClockState> | null | undefined): PokerClockState {
  if (!value) return fallbackPokerClockState;
  const levels = normalizePokerClockLevels(value.levels);
  return {
    id: value.id ?? POKER_CLOCK_ID,
    levels,
    current_level_index: clampLevelIndex(Number(value.current_level_index ?? 0), levels),
    status: normalizeStatus(value.status),
    started_at: value.started_at ?? null,
    paused_remaining_seconds: normalizeNullableInteger(value.paused_remaining_seconds),
    entries: normalizeNonNegativeInteger(value.entries),
    remaining_players: normalizeNonNegativeInteger(value.remaining_players),
    buy_in_stack: normalizeNonNegativeInteger(value.buy_in_stack, 10000),
    entry_price: normalizeNonNegativeNumber(value.entry_price, 10),
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

export function normalizePokerClockLevels(levels: unknown): PokerClockLevel[] {
  if (!Array.isArray(levels)) return defaultPokerClockLevels;
  const normalized = levels
    .map((level) => normalizePokerClockLevel(level))
    .filter((level): level is PokerClockLevel => Boolean(level));
  return normalized.length > 0 ? normalized : defaultPokerClockLevels;
}

export function pokerClockStats(state: Pick<PokerClockState, "entries" | "remaining_players" | "buy_in_stack" | "entry_price">): PokerClockDerivedStats {
  const totalChips = state.entries * state.buy_in_stack;
  return {
    totalChips,
    averageStack: state.remaining_players > 0 ? Math.floor(totalChips / state.remaining_players) : 0,
    prizePool: state.entries * state.entry_price,
  };
}

export function currentPokerClockLevel(state: PokerClockState) {
  return state.levels[state.current_level_index] ?? state.levels[0] ?? null;
}

export function previousPokerClockLevel(state: PokerClockState) {
  return state.current_level_index > 0 ? state.levels[state.current_level_index - 1] : null;
}

export function nextPokerClockLevel(state: PokerClockState) {
  return state.levels[state.current_level_index + 1] ?? null;
}

export function levelDurationSeconds(level: PokerClockLevel | null | undefined) {
  return Math.max(0, Math.floor(level?.durationSeconds ?? 0));
}

export function remainingSecondsForState(state: PokerClockState, nowMs = Date.now()) {
  const currentLevel = currentPokerClockLevel(state);
  const durationSeconds = levelDurationSeconds(currentLevel);
  if (state.status === "paused") {
    return clampSeconds(state.paused_remaining_seconds ?? durationSeconds);
  }
  if (state.status !== "running" || !state.started_at) {
    return durationSeconds;
  }

  const startedAtMs = Date.parse(state.started_at);
  if (Number.isNaN(startedAtMs)) return durationSeconds;
  const elapsedSeconds = Math.floor((nowMs - startedAtMs) / 1000);
  return clampSeconds(durationSeconds - elapsedSeconds);
}

export function formatClockTime(seconds: number) {
  const normalizedSeconds = clampSeconds(seconds);
  const minutes = Math.floor(normalizedSeconds / 60);
  const remainder = normalizedSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function formatPokerLevel(level: PokerClockLevel | null | undefined) {
  if (!level) return "No level";
  if (level.type === "break") return level.label.trim() || "BREAK";
  return `${level.smallBlind} / ${level.bigBlind}`;
}

export function applyClockControl(state: PokerClockState, control: "start" | "pause" | "resume" | "reset" | "next" | "previous", now = new Date()) {
  const currentRemaining = remainingSecondsForState(state, now.getTime());
  const nextState = { ...state };

  if (control === "start" || control === "resume") {
    const remainingSeconds = control === "resume" ? currentRemaining : levelDurationSeconds(currentPokerClockLevel(state));
    nextState.status = "running";
    nextState.started_at = new Date(now.getTime() - (levelDurationSeconds(currentPokerClockLevel(state)) - remainingSeconds) * 1000).toISOString();
    nextState.paused_remaining_seconds = null;
    return nextState;
  }

  if (control === "pause") {
    nextState.status = "paused";
    nextState.started_at = null;
    nextState.paused_remaining_seconds = currentRemaining;
    return nextState;
  }

  if (control === "reset") {
    nextState.status = "idle";
    nextState.started_at = null;
    nextState.paused_remaining_seconds = null;
    return nextState;
  }

  const direction = control === "next" ? 1 : -1;
  nextState.current_level_index = clampLevelIndex(state.current_level_index + direction, state.levels);
  nextState.status = "idle";
  nextState.started_at = null;
  nextState.paused_remaining_seconds = null;
  return nextState;
}

export function validatePokerClockStateInput(input: {
  levels: unknown;
  entries: unknown;
  remaining_players: unknown;
  buy_in_stack: unknown;
  entry_price: unknown;
}) {
  const levels = normalizePokerClockLevels(input.levels);
  const entries = normalizeNonNegativeInteger(input.entries);
  const remainingPlayers = normalizeNonNegativeInteger(input.remaining_players);
  const buyInStack = normalizeNonNegativeInteger(input.buy_in_stack, 10000);
  const entryPrice = normalizeNonNegativeNumber(input.entry_price, 10);

  if (remainingPlayers > entries && entries > 0) {
    return { success: false as const, message: "Remaining players cannot be greater than total entries." };
  }

  return {
    success: true as const,
    data: {
      levels,
      entries,
      remaining_players: remainingPlayers,
      buy_in_stack: buyInStack,
      entry_price: entryPrice,
    },
  };
}

function normalizePokerClockLevel(level: unknown): PokerClockLevel | null {
  if (!level || typeof level !== "object") return null;
  const record = level as Record<string, unknown>;
  const durationSeconds = Math.max(1, normalizeNonNegativeInteger(record.durationSeconds, 20 * 60));

  if (record.type === "break") {
    return {
      type: "break",
      durationSeconds,
      label: String(record.label ?? "BREAK").trim() || "BREAK",
    };
  }

  if (record.type === "blind") {
    return {
      type: "blind",
      durationSeconds,
      smallBlind: Math.max(0, normalizeNonNegativeInteger(record.smallBlind)),
      bigBlind: Math.max(0, normalizeNonNegativeInteger(record.bigBlind)),
    };
  }

  return null;
}

function normalizeStatus(status: unknown): PokerClockStatus {
  return status === "running" || status === "paused" || status === "idle" ? status : "idle";
}

function normalizeNullableInteger(value: unknown) {
  if (value === null || value === undefined) return null;
  return normalizeNonNegativeInteger(value);
}

function normalizeNonNegativeInteger(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function normalizeNonNegativeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function clampLevelIndex(index: number, levels: PokerClockLevel[]) {
  if (levels.length === 0) return 0;
  return Math.min(Math.max(Math.floor(index), 0), levels.length - 1);
}

function clampSeconds(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return 0;
  return Math.floor(seconds);
}
