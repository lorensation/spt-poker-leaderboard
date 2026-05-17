"use client";

import { Trophy, Star, Coins } from "lucide-react";

import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { PlayerStats } from "@/lib/types";

export function PlayerStatPopover({ player }: { player: PlayerStats }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-auto justify-start gap-3 px-2 py-1.5">
          <PlayerAvatar nickname={player.nickname} avatarUrl={player.avatar_url} className="h-9 w-9" />
          <span className="text-left font-medium">{player.nickname}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 border-amber-500/20 bg-zinc-950 text-zinc-100">
        <div className="flex items-center gap-3">
          <PlayerAvatar nickname={player.nickname} avatarUrl={player.avatar_url} className="h-14 w-14" />
          <div>
            <div className="text-lg font-semibold">{player.nickname}</div>
            <div className="text-sm text-amber-200">{formatNumber(player.average_stars, 2)} stars</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Stat icon={<Coins className="h-4 w-4" />} label="Money rank" value={`#${player.money_rank}`} />
          <Stat icon={<Trophy className="h-4 w-4" />} label="Points rank" value={`#${player.performance_rank}`} />
          <Stat label="Net profit" value={formatCurrency(player.net_profit)} />
          <Stat label="Total points" value={String(player.total_points)} />
          <Stat label="Games" value={String(player.games_played)} />
          <Stat label="Wins" value={String(player.wins)} />
          <Stat label="Podiums" value={String(player.podiums)} />
          <Stat icon={<Star className="h-4 w-4" />} label="Avg finish" value={formatNumber(player.average_finish)} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/3 p-3">
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-semibold text-zinc-50">{value}</div>
    </div>
  );
}
