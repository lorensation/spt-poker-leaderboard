import Link from "next/link";
import { CalendarDays, CircleDollarSign, Users } from "lucide-react";

import { PlayerAvatar } from "@/components/player-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { GameCardData } from "@/lib/types";

export function GameCard({ game }: { game: GameCardData }) {
  return (
    <Card className="border-amber-500/20 bg-zinc-950/80">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{game.title}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDate(game.played_at)}</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{game.player_count} players</span>
              <span className="inline-flex items-center gap-1.5"><CircleDollarSign className="h-4 w-4" />{formatCurrency(game.total_pot)} pot</span>
            </div>
          </div>
          <Badge variant={game.status === "voting_open" ? "default" : "secondary"}>{game.status.replace("_", " ")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {game.winner ? (
          <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3">
            <PlayerAvatar nickname={game.winner.nickname} avatarUrl={game.winner.avatar_url} className="h-10 w-10" />
            <div>
              <div className="text-xs text-zinc-400">Winner</div>
              <div className="font-semibold">{game.winner.nickname}</div>
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {game.top_three.map((result) => (
            <Badge key={result.id} variant="outline" className="border-amber-500/30">
              #{result.finish_position} {result.players.nickname}
            </Badge>
          ))}
        </div>
        <Button asChild className="w-full">
          <Link href={`/games/${game.id}`}>View details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
