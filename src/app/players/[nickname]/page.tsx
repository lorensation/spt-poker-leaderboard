import Link from "next/link";
import { notFound } from "next/navigation";

import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerProfileEditor } from "@/components/player-profile-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { getPlayerHistory, getPlayerStatsByNickname } from "@/lib/queries/players";

export default async function PlayerProfilePage({ params }: { params: Promise<{ nickname: string }> }) {
  const { nickname } = await params;
  const player = await getPlayerStatsByNickname(decodeURIComponent(nickname));
  if (!player) notFound();
  const history = (await getPlayerHistory(player.player_id)).sort(
    (a, b) => new Date(b.games.played_at).getTime() - new Date(a.games.played_at).getTime()
  );
  const bestFinish = history.reduce((best, result) => Math.min(best, result.finish_position), Number.POSITIVE_INFINITY);
  const latest = history[0];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
            <PlayerAvatar nickname={player.nickname} avatarUrl={player.avatar_url} className="h-28 w-28" />
            <div className="flex-1">
              <Badge>Player profile</Badge>
              <h1 className="mt-3 text-4xl font-bold">{player.nickname}</h1>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Net money" value={formatCurrency(player.net_profit)} />
                <Metric label="Money rank" value={`#${player.money_rank}`} />
                <Metric label="Points" value={String(player.total_points)} />
                <Metric label="Performance rank" value={`#${player.performance_rank}`} />
                <Metric label="Stars" value={formatNumber(player.average_stars, 2)} />
                <Metric label="Games" value={String(player.games_played)} />
                <Metric label="Wins" value={String(player.wins)} />
                <Metric label="Podiums" value={String(player.podiums)} />
                <Metric label="Average finish" value={formatNumber(player.average_finish)} />
                <Metric label="Best finish" value={Number.isFinite(bestFinish) ? `#${bestFinish}` : "-"} />
                <Metric label="Latest game" value={latest ? latest.games.title : "-"} />
                <Metric label="Avg profit" value={formatCurrency(player.average_profit_per_game)} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader><CardTitle>Edit profile</CardTitle></CardHeader>
          <CardContent><PlayerProfileEditor player={player} /></CardContent>
        </Card>
      </section>

      <Card className="border-amber-500/20 bg-zinc-950/80">
        <CardHeader><CardTitle>Historical game results</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Game</TableHead>
                <TableHead className="text-right">Finish</TableHead>
                <TableHead className="text-right">Money</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{formatDate(result.games.played_at)}</TableCell>
                  <TableCell><Link className="hover:text-amber-200" href={`/games/${result.games.id}`}>{result.games.title}</Link></TableCell>
                  <TableCell className="text-right">#{result.finish_position}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(result.money_earned)}</TableCell>
                  <TableCell className="text-right">{result.finishing_points}</TableCell>
                </TableRow>
              ))}
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
