"use client";

import { useMemo, useState } from "react";
import { Plus, Save } from "lucide-react";

import { createGameWithResults } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Player } from "@/lib/types";

type Row = {
  player_id: string;
  finish_position: number;
  buyins: number;
  rebuys: number;
  addon: boolean;
  money_earned: number;
  notes: string;
};

export function AdminGameForm({ players }: { players: Player[] }) {
  const [rows, setRows] = useState<Row[]>([]);
  const usedPlayers = useMemo(() => new Set(rows.map((row) => row.player_id).filter(Boolean)), [rows]);

  return (
    <form action={createGameWithResults} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Game title</Label>
          <Input name="title" placeholder="Poker Night" required />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" name="played_at" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea name="notes" placeholder="Optional game notes" />
      </div>
      <input type="hidden" name="results" value={JSON.stringify(rows.filter((row) => row.player_id))} />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Results</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() =>
              setRows((current) => [
                ...current,
                {
                  player_id: "",
                  finish_position: current.length + 1,
                  buyins: 1,
                  rebuys: 0,
                  addon: false,
                  money_earned: 0,
                  notes: "",
                },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            Add player
          </Button>
        </div>
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 lg:grid-cols-[1.5fr_repeat(5,1fr)]">
              <Select
                value={row.player_id}
                onValueChange={(value) => updateRow(setRows, index, { player_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Player" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id} disabled={usedPlayers.has(player.id) && player.id !== row.player_id}>
                      {player.nickname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" min={1} value={row.finish_position} onChange={(event) => updateRow(setRows, index, { finish_position: Number(event.target.value) })} />
              <Input type="number" min={0} value={row.buyins} onChange={(event) => updateRow(setRows, index, { buyins: Number(event.target.value) })} />
              <Input type="number" min={0} value={row.rebuys} onChange={(event) => updateRow(setRows, index, { rebuys: Number(event.target.value) })} />
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={row.addon} onCheckedChange={(checked) => updateRow(setRows, index, { addon: checked === true })} />
                Addon
              </label>
              <Input type="number" step="0.01" value={row.money_earned} onChange={(event) => updateRow(setRows, index, { money_earned: Number(event.target.value) })} />
            </div>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full gap-2">
        <Save className="h-4 w-4" />
        Save game and open voting
      </Button>
    </form>
  );
}

function updateRow(setRows: React.Dispatch<React.SetStateAction<Row[]>>, index: number, patch: Partial<Row>) {
  setRows((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
}
