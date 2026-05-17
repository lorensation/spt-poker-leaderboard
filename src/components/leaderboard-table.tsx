import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { PlayerStatPopover } from "@/components/player-stat-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { LeaderboardKind, PlayerStats } from "@/lib/types";

export function LeaderboardTable({
  kind,
  rows,
  total,
  page,
  pageSize,
  search,
}: {
  kind: LeaderboardKind;
  rows: PlayerStats[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card className="border-amber-500/20 bg-zinc-950/80">
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{kind === "money" ? "Money Leaderboard" : "Performance Leaderboard"}</CardTitle>
          <p className="mt-1 text-sm text-zinc-400">9 players per page, searchable by nickname.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant={kind === "money" ? "default" : "outline"}>
            <Link href="/leaderboard/money">Money</Link>
          </Button>
          <Button asChild variant={kind === "points" ? "default" : "outline"}>
            <Link href="/leaderboard/points">Performance</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form className="mb-4">
          <Input name="q" defaultValue={search} placeholder="Search players..." className="max-w-sm" />
        </form>
        <div className="overflow-hidden rounded-lg border border-white/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">{kind === "money" ? "Net profit" : "Points"}</TableHead>
                <TableHead className="hidden text-right md:table-cell">Games</TableHead>
                <TableHead className="hidden text-right md:table-cell">{kind === "money" ? "Avg profit" : "Wins / Podiums"}</TableHead>
                <TableHead className="hidden text-right lg:table-cell">{kind === "money" ? "Best / Worst" : "Stars"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((player) => {
                const rank = kind === "money" ? player.money_rank : player.performance_rank;
                return (
                  <TableRow key={player.player_id}>
                    <TableCell>
                      <Badge variant={rank <= 3 ? "default" : "secondary"}>#{rank}</Badge>
                    </TableCell>
                    <TableCell>
                      <PlayerStatPopover player={player} />
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {kind === "money" ? formatCurrency(player.net_profit) : player.total_points}
                    </TableCell>
                    <TableCell className="hidden text-right md:table-cell">{player.games_played}</TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      {kind === "money" ? formatCurrency(player.average_profit_per_game) : `${player.wins} / ${player.podiums}`}
                    </TableCell>
                    <TableCell className="hidden text-right lg:table-cell">
                      {kind === "money" ? (
                        <span className="inline-flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4 text-emerald-300" />
                          {formatCurrency(player.best_night)}
                          <ArrowDownRight className="h-4 w-4 text-red-300" />
                          {formatCurrency(player.worst_night)}
                        </span>
                      ) : (
                        `${player.average_stars} stars`
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-zinc-400">
                    No players found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" disabled={page <= 1}>
              <Link href={`?page=${Math.max(1, page - 1)}${search ? `&q=${encodeURIComponent(search)}` : ""}`}>Previous</Link>
            </Button>
            <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
              <Link href={`?page=${Math.min(totalPages, page + 1)}${search ? `&q=${encodeURIComponent(search)}` : ""}`}>Next</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
