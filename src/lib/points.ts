export function finishingPoints(position: number | null) {
  if (position === null) return 0;
  return (
    (
      {
        1: 10,
        2: 8,
        3: 7,
        4: 6,
        5: 5,
        6: 4,
        7: 3,
        8: 2,
        9: 1,
      } as Record<number, number>
    )[position] ?? 0
  );
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
