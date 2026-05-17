import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Trophy } from "lucide-react";

import { GameResultEditor } from "@/components/game-result-editor";
import { PlayerAvatar } from "@/components/player-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { getGameDetail } from "@/lib/queries/games";
import { isAdminSession } from "@/lib/security/admin";

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [game, isAdmin] = await Promise.all([getGameDetail(id), isAdminSession()]);
  if (!game) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge>{game.status.replace("_", " ")}</Badge>
          <h1 className="mt-3 text-3xl font-bold">{game.title}</h1>
          <p className="mt-2 text-zinc-400">{formatDate(game.played_at)} · {game.player_count} players · {formatCurrency(game.total_pot)} total pot</p>
        </div>
        {game.status === "voting_open" ? (
          <Button asChild><Link href={`/vote/${game.id}`}>Vote top 3</Link></Button>
        ) : null}
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Summary title="Winner" value={game.winner?.nickname ?? "Pending"} icon={<Trophy className="h-5 w-5" />} />
        <Summary title="MVP of the night" value={game.mvp?.player.nickname ?? "No votes yet"} icon={<Star className="h-5 w-5" />} />
        <Summary title="Vote points" value={game.mvp ? `${game.mvp.points} for ${game.mvp.player.nickname}` : "0 awarded"} icon={<Star className="h-5 w-5" />} />
      </section>

      <Card className="border-amber-500/20 bg-zinc-950/80">
        <CardHeader><CardTitle>Final ranking</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Place</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Earned</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Finish pts</TableHead>
                <TableHead className="text-right">Vote pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {game.results.map((result) => {
                const voteTotal = game.vote_totals.find((vote) => vote.player.id === result.player_id)?.points ?? 0;
                return (
                  <TableRow key={result.id}>
                    <TableCell>{result.finish_position === null ? "NQ" : `#${result.finish_position}`}</TableCell>
                    <TableCell>
                      <Link href={`/players/${encodeURIComponent(result.players.nickname)}`} className="flex items-center gap-2 hover:text-amber-200">
                        <PlayerAvatar nickname={result.players.nickname} avatarUrl={result.players.avatar_url} className="h-8 w-8" />
                        {result.players.nickname}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(result.money_spent)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(result.money_earned)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(result.net_profit)}</TableCell>
                    <TableCell className="text-right">{result.finishing_points}</TableCell>
                    <TableCell className="text-right">{voteTotal}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader><CardTitle>Admin result editor</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {game.results.map((result) => (
              <GameResultEditor key={result.id} gameId={game.id} result={result} />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Summary({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="border-amber-500/20 bg-zinc-950/80">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-md bg-amber-400 p-3 text-zinc-950">{icon}</div>
        <div>
          <div className="text-sm text-zinc-400">{title}</div>
          <div className="font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
