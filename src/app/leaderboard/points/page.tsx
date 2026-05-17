import { LeaderboardTable } from "@/components/leaderboard-table";
import { Podium } from "@/components/podium";
import { getLeaderboard, getTopPlayers } from "@/lib/queries/leaderboards";

export default async function PointsLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const search = params.q ?? "";
  const [top, leaderboard] = await Promise.all([
    getTopPlayers("points"),
    getLeaderboard({ kind: "points", page, search }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Performance Leaderboard</h1>
        <p className="mt-2 text-zinc-400">Ranked by finishing points plus MVP vote bonuses.</p>
      </div>
      <Podium players={top} kind="points" />
      <LeaderboardTable kind="points" search={search} {...leaderboard} />
    </div>
  );
}
