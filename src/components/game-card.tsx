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
    <Card className="flex h-full min-h-80 flex-col border-amber-500/20 bg-zinc-950/80">
      <CardHeader className="pb-3">
        <div className="grid gap-3">
          <div className="flex min-h-8 items-start justify-between gap-4">
            <CardTitle className="leading-8">{game.title}</CardTitle>
            <Badge variant={game.status === "voting_open" ? "default" : "secondary"} className="shrink-0">{game.status.replace("_", " ")}</Badge>
          </div>
          <div className="grid min-h-11 gap-2 text-sm text-zinc-400 sm:grid-cols-3">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><CalendarDays className="h-4 w-4" />{formatDate(game.played_at)}</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Users className="h-4 w-4" />{game.player_count} players</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><CircleDollarSign className="h-4 w-4" />{formatCurrency(game.total_pot)} pot</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {game.winner ? (
          <div className="flex min-h-20 items-center gap-3 rounded-md border border-white/10 bg-white/3 p-3">
            <PlayerAvatar nickname={game.winner.nickname} avatarUrl={game.winner.avatar_url} className="h-10 w-10" />
            <div>
              <div className="text-xs text-zinc-400">Winner</div>
              <div className="font-semibold">{game.winner.nickname}</div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-20 items-center rounded-md border border-dashed border-white/10 bg-white/3 p-3 text-sm text-zinc-400">
            Winner pending
          </div>
        )}
        <div className="flex min-h-8 flex-wrap content-start gap-2">
          {game.top_three.map((result) => (
            <Badge key={result.id} variant="outline" className="border-amber-500/30">
              {result.finish_position === null ? "NQ" : `#${result.finish_position}`} {result.players.nickname}
            </Badge>
          ))}
        </div>
        <Button asChild className="mt-auto w-full">
          <Link href={`/games/${game.id}`}>View details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
