"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, X } from "lucide-react";
import { toast } from "sonner";

import { createGameWithResults } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Player } from "@/lib/types";
import { parseGamePayload } from "@/lib/validation/game-results";

type Row = {
  id: string;
  player_id: string;
  finish_position: string;
  money_spent: string;
  money_earned: string;
};

export function AdminGameForm({ players }: { players: Player[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([createEmptyRow()]);
  const [title, setTitle] = useState("");
  const [playedAt, setPlayedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const usedPlayers = useMemo(() => new Set(rows.map((row) => row.player_id).filter(Boolean)), [rows]);

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const payload = {
          title,
          played_at: playedAt,
          notes,
          results: rows.map(({ player_id, finish_position, money_spent, money_earned }) => ({
            player_id,
            finish_position: finish_position === "nq" ? null : finish_position,
            money_spent,
            money_earned,
          })),
        };
        const validation = parseGamePayload(payload);
        if (!validation.success) {
          toast.error(validation.message);
          return;
        }

        const formData = new FormData();
        formData.set("title", title);
        formData.set("played_at", playedAt);
        formData.set("notes", notes);
        formData.set("results", JSON.stringify(payload.results));

        startTransition(async () => {
          const result = await createGameWithResults(formData);
          if (result.success) {
            toast.success(result.message);
            router.push(`/games/${result.data?.gameId}`);
          } else {
            toast.error(result.message);
          }
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="game-title">Game title</Label>
          <Input id="game-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Auto: Poker Night - date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="played-at">Date</Label>
          <Input id="played-at" type="date" value={playedAt} onChange={(event) => setPlayedAt(event.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="game-notes">Notes</Label>
        <Textarea id="game-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional game notes" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Results</Label>
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setRows((current) => [...current, createEmptyRow()])}>
            <Plus className="h-4 w-4" />
            Add player
          </Button>
        </div>
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={row.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end">
              <div className="space-y-2">
                <Label>Player</Label>
                <Select value={row.player_id} onValueChange={(value) => updateRow(setRows, index, { player_id: value })}>
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
              </div>
              <div className="space-y-2">
                <Label>Finish position</Label>
                <Select value={row.finish_position} onValueChange={(value) => updateRow(setRows, index, { finish_position: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select finish" />
                  </SelectTrigger>
                  <SelectContent>
                    {finishOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <MoneyInput label="Money spent" value={row.money_spent} onChange={(value) => updateRow(setRows, index, { money_spent: value })} />
              <MoneyInput label="Money earned" value={row.money_earned} onChange={(value) => updateRow(setRows, index, { money_earned: value })} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove player row"
                onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                disabled={rows.length === 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={isPending || players.length < 2} className="w-full gap-2">
        <Save className="h-4 w-4" />
        Save game and open voting
      </Button>
    </form>
  );
}

const finishOptions = [
  { value: "1", label: "1st" },
  { value: "2", label: "2nd" },
  { value: "3", label: "3rd" },
  { value: "4", label: "4th" },
  { value: "5", label: "5th" },
  { value: "6", label: "6th" },
  { value: "7", label: "7th" },
  { value: "8", label: "8th" },
  { value: "9", label: "9th" },
  { value: "nq", label: "Not qualified" },
];

function MoneyInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        step={5}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onWheel={(event) => event.currentTarget.blur()}
        onBlur={() => {
          if (value === "") onChange("0");
          else if (Number(value) < 0) onChange("0");
        }}
        placeholder="0"
      />
    </div>
  );
}

function createEmptyRow(): Row {
  return {
    id: crypto.randomUUID(),
    player_id: "",
    finish_position: "",
    money_spent: "",
    money_earned: "",
  };
}

function updateRow(setRows: React.Dispatch<React.SetStateAction<Row[]>>, index: number, patch: Partial<Row>) {
  setRows((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
}
