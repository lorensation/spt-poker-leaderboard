const FINISHING_POINTS = {
  1: 25,
  2: 20,
  3: 15,
  4: 10,
  5: 8,
  6: 6,
  7: 4,
  8: 2,
  9: 1,
} as Record<number, number>;

export function finishingPoints(position: number | null, tiedPlayerCount = 1) {
  if (position === null) return 0;
  const basePoints = FINISHING_POINTS[position] ?? 0;
  if (basePoints === 0) return 0;
  return Math.max(0, basePoints - (tiedPlayerCount > 1 ? tiedPlayerCount : 0));
}

export function finishingPointsByPosition(positions: Array<number | null>) {
  const counts = new Map<number, number>();
  for (const position of positions) {
    if (position === null) continue;
    counts.set(position, (counts.get(position) ?? 0) + 1);
  }

  return positions.map((position) => finishingPoints(position, position === null ? 1 : counts.get(position) ?? 1));
}

export function votePoints(rank: 1 | 2 | 3) {
  return rank === 1 ? 6 : rank === 2 ? 4 : 2;
}

export function starRating(totalPoints: number, gamesPlayed: number) {
  if (gamesPlayed <= 0) return 0;
  const pointsPerGame = totalPoints / gamesPlayed;
  if (pointsPerGame <= 2) return clamp(pointsPerGame);
  if (pointsPerGame <= 4) return clamp(2 + (pointsPerGame - 2) / 2);
  if (pointsPerGame <= 6) return clamp(3 + (pointsPerGame - 4) / 2);
  if (pointsPerGame <= 8) return clamp(4 + (pointsPerGame - 6) / 2);
  return 5;
}

function clamp(value: number) {
  return Math.min(5, Math.max(0, Number(value.toFixed(2))));
}
