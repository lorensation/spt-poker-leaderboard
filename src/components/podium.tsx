"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Medal, Spade } from "lucide-react";

import { PlayerAvatar } from "@/components/player-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { LeaderboardKind, PlayerStats } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Podium({ players, kind }: { players: PlayerStats[]; kind: LeaderboardKind }) {
  const ordered = [players[1], players[0], players[2]].filter(Boolean);
  if (ordered.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-amber-500/20 bg-white/3 p-8 text-center text-zinc-400">
        Add players and game results to light up the podium.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 md:items-end">
      {ordered.map((player) => {
        const rank = kind === "money" ? player.money_rank : player.performance_rank;
        return (
          <motion.div
            key={player.player_id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.08 }}
            className={cn(rank === 1 && "md:-mt-5 md:pb-5")}
          >
            <Card className={cn("border-amber-500/20 bg-zinc-950/80", rank === 1 && "border-amber-300/60")}>
              <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
                <Badge className="gap-1 bg-amber-400 text-zinc-950">
                  {rank === 1 ? <Crown className="h-3.5 w-3.5" /> : <Medal className="h-3.5 w-3.5" />}
                  #{rank}
                </Badge>
                <PlayerAvatar nickname={player.nickname} avatarUrl={player.avatar_url} className="h-20 w-20" />
                <div>
                  <Link href={`/players/${encodeURIComponent(player.nickname)}`} className="font-semibold text-zinc-50 hover:text-amber-200">
                    {player.nickname}
                  </Link>
                  <div className="mt-1 font-mono text-2xl font-bold text-amber-200">
                    {kind === "money" ? formatCurrency(player.net_profit) : `${player.total_points} pts`}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {kind === "money"
                      ? `${player.games_played} games / ${formatCurrency(player.average_profit_per_game)} avg`
                      : `${player.average_stars} stars / ${player.wins} wins / ${player.podiums} podiums`}
                  </div>
                </div>
                <Spade className="h-5 w-5 text-red-400" />
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
