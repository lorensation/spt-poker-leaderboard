import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Trophy } from "lucide-react";

import { updateGameResult } from "@/app/actions/admin";
import { PlayerAvatar } from "@/components/player-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
                <TableHead className="text-right">Money</TableHead>
                <TableHead className="text-right">Buyins</TableHead>
                <TableHead className="text-right">Rebuys</TableHead>
                <TableHead className="text-right">Addon</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Votes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {game.results.map((result) => {
                const voteTotal = game.vote_totals.find((vote) => vote.player.id === result.player_id)?.points ?? 0;
                return (
                  <TableRow key={result.id}>
                    <TableCell>#{result.finish_position}</TableCell>
                    <TableCell>
                      <Link href={`/players/${encodeURIComponent(result.players.nickname)}`} className="flex items-center gap-2 hover:text-amber-200">
                        <PlayerAvatar nickname={result.players.nickname} avatarUrl={result.players.avatar_url} className="h-8 w-8" />
                        {result.players.nickname}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(result.money_earned)}</TableCell>
                    <TableCell className="text-right">{result.buyins}</TableCell>
                    <TableCell className="text-right">{result.rebuys}</TableCell>
                    <TableCell className="text-right">{result.addon ? "Yes" : "No"}</TableCell>
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
              <form key={result.id} action={updateGameResult} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[1fr_repeat(5,8rem)_auto] md:items-center">
                <input type="hidden" name="resultId" value={result.id} />
                <input type="hidden" name="gameId" value={game.id} />
                <div className="font-medium">{result.players.nickname}</div>
                <Input name="finish_position" type="number" min={1} defaultValue={result.finish_position} aria-label="Finish position" />
                <Input name="money_earned" type="number" step="0.01" defaultValue={result.money_earned} aria-label="Money earned" />
                <Input name="buyins" type="number" min={0} defaultValue={result.buyins} aria-label="Buyins" />
                <Input name="rebuys" type="number" min={0} defaultValue={result.rebuys} aria-label="Rebuys" />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox name="addon" defaultChecked={result.addon} />
                  Addon
                </label>
                <Button size="sm">Save</Button>
              </form>
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
