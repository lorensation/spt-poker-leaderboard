import Link from "next/link";

import { logoutPlayer } from "@/app/actions/auth";
import { MoneyValue } from "@/components/money-value";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerProfileEditor } from "@/components/player-profile-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { requireCurrentPlayer } from "@/lib/auth/player";
import { getPlayerHistory, getPlayerStatsById, getPlayerVoteHistory } from "@/lib/queries/players";

export default async function ProfilePage() {
  const currentPlayer = await requireCurrentPlayer();
  const [stats, history, votes] = await Promise.all([
    getPlayerStatsById(currentPlayer.playerId),
    getPlayerHistory(currentPlayer.playerId),
    getPlayerVoteHistory(currentPlayer.playerId),
  ]);

  const sortedHistory = [...history].sort((a, b) => new Date(b.games.played_at).getTime() - new Date(a.games.played_at).getTime());
  const totalSpent = history.reduce((sum, result) => sum + Number(result.money_spent ?? 0), 0);
  const totalEarned = history.reduce((sum, result) => sum + Number(result.money_earned ?? 0), 0);
  const netProfit = totalEarned - totalSpent;
  const bestFinish = history.reduce(
    (best, result) => (result.finish_position === null ? best : Math.min(best, result.finish_position)),
    Number.POSITIVE_INFINITY
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
            <PlayerAvatar nickname={currentPlayer.player.nickname} avatarUrl={currentPlayer.player.avatar_url} className="h-28 w-28" />
            <div className="flex-1">
              <Badge>Your profile</Badge>
              <h1 className="mt-3 text-4xl font-bold">{currentPlayer.player.nickname}</h1>
              <p className="mt-2 text-sm text-zinc-400">{currentPlayer.email}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Money rank" value={stats ? `#${stats.money_rank}` : "-"} />
                <Metric label="Performance rank" value={stats ? `#${stats.performance_rank}` : "-"} />
                <Metric label="Total points" value={stats ? String(stats.total_points) : "0"} />
                <Metric label="Games" value={stats ? String(stats.games_played) : "0"} />
                <Metric label="Wins" value={stats ? String(stats.wins) : "0"} />
                <Metric label="Podiums" value={stats ? String(stats.podiums) : "0"} />
                <Metric label="Stars" value={stats ? formatNumber(stats.average_stars, 2) : "0"} />
                <Metric label="Best finish" value={Number.isFinite(bestFinish) ? `#${bestFinish}` : "-"} />
                <Metric label="Money spent" value={formatCurrency(totalSpent)} />
                <Metric label="Money earned" value={formatCurrency(totalEarned)} />
                <Metric label="Net profit" value={formatCurrency(netProfit)} />
                <Metric label="Votes cast" value={String(votes.length)} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader><CardTitle>Profile settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <PlayerProfileEditor />
            <form action={logoutPlayer}>
              <Button type="submit" variant="outline" className="w-full">Sign out</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card className="border-amber-500/20 bg-zinc-950/80">
        <CardHeader><CardTitle>Past games</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Game</TableHead>
                <TableHead className="text-right">Finish</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Earned</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHistory.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{formatDate(result.games.played_at)}</TableCell>
                  <TableCell><Link className="hover:text-amber-200" href={`/games/${result.games.id}`}>{result.games.title}</Link></TableCell>
                  <TableCell className="text-right">{result.finish_position === null ? "NQ" : `#${result.finish_position}`}</TableCell>
                  <TableCell className="text-right"><MoneyValue value={result.money_spent} variant="spent" /></TableCell>
                  <TableCell className="text-right"><MoneyValue value={result.money_earned} variant="earned" /></TableCell>
                  <TableCell className="text-right"><MoneyValue value={result.net_profit} variant="net" /></TableCell>
                  <TableCell className="text-right">{result.finishing_points}</TableCell>
                </TableRow>
              ))}
              {sortedHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-zinc-400">No games recorded yet.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 bg-zinc-950/80">
        <CardHeader><CardTitle>Voting history</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Game</TableHead>
                <TableHead>Voted player</TableHead>
                <TableHead className="text-right">Rank</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {votes.map((vote) => (
                <TableRow key={vote.id}>
                  <TableCell>{formatDate(vote.games.played_at)}</TableCell>
                  <TableCell><Link className="hover:text-amber-200" href={`/games/${vote.games.id}`}>{vote.games.title}</Link></TableCell>
                  <TableCell>{vote.voted_player.nickname}</TableCell>
                  <TableCell className="text-right">#{vote.vote_rank}</TableCell>
                  <TableCell className="text-right">{vote.points_awarded}</TableCell>
                </TableRow>
              ))}
              {votes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-zinc-400">No votes submitted yet.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
