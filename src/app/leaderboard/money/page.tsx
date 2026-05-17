import { LeaderboardTable } from "@/components/leaderboard-table";
import { Podium } from "@/components/podium";
import { getLeaderboard, getTopPlayers } from "@/lib/queries/leaderboards";

export default async function MoneyLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const search = params.q ?? "";
  const [top, leaderboard] = await Promise.all([
    getTopPlayers("money"),
    getLeaderboard({ kind: "money", page, search }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Money Leaderboard</h1>
        <p className="mt-2 text-zinc-400">Ranked by all-time net profit.</p>
      </div>
      <Podium players={top} kind="money" />
      <LeaderboardTable kind="money" search={search} {...leaderboard} />
    </div>
  );
}
