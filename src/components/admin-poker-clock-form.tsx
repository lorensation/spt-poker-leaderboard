"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Plus, RotateCcw, Save, SkipBack, SkipForward, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { controlPokerClock, savePokerClockConfiguration } from "@/app/actions/poker-clock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  currentPokerClockLevel,
  formatClockTime,
  formatPokerLevel,
  pokerClockStats,
  remainingSecondsForState,
  type PokerClockLevel,
  type PokerClockState,
} from "@/lib/poker-clock";

type LevelRow = {
  id: string;
  type: "blind" | "break";
  durationMinutes: string;
  smallBlind: string;
  bigBlind: string;
  ante: string;
  label: string;
};

export function AdminPokerClockForm({ initialState }: { initialState: PokerClockState }) {
  const router = useRouter();
  const [entries, setEntries] = useState(String(initialState.entries));
  const [remainingPlayers, setRemainingPlayers] = useState(String(initialState.remaining_players));
  const [buyInStack, setBuyInStack] = useState(String(initialState.buy_in_stack));
  const [entryPrice, setEntryPrice] = useState(String(initialState.entry_price));
  const [rows, setRows] = useState<LevelRow[]>(() => initialState.levels.map((level, index) => levelToRow(level, index)));
  const [isPending, startTransition] = useTransition();
  const stats = useMemo(
    () =>
      pokerClockStats({
        entries: Number(entries) || 0,
        remaining_players: Number(remainingPlayers) || 0,
        buy_in_stack: Number(buyInStack) || 0,
        entry_price: Number(entryPrice) || 0,
      }),
    [buyInStack, entries, entryPrice, remainingPlayers]
  );
  const currentLevel = currentPokerClockLevel(initialState);
  const remainingSeconds = remainingSecondsForState(initialState);

  function saveConfiguration() {
    const levels = rows.map(rowToLevel).filter((level): level is PokerClockLevel => Boolean(level));
    if (levels.length === 0) {
      toast.error("Add at least one level.");
      return;
    }

    const formData = new FormData();
    formData.set("levels", JSON.stringify(levels));
    formData.set("entries", entries);
    formData.set("remaining_players", remainingPlayers);
    formData.set("buy_in_stack", buyInStack);
    formData.set("entry_price", entryPrice);

    startTransition(async () => {
      const result = await savePokerClockConfiguration(formData);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function runControl(control: "start" | "pause" | "resume" | "reset" | "next" | "previous") {
    const formData = new FormData();
    formData.set("control", control);
    startTransition(async () => {
      const result = await controlPokerClock(formData);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader>
            <CardTitle>Clock controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge className="bg-amber-400 text-zinc-950">{initialState.status}</Badge>
                <div className="font-mono text-4xl font-black">{formatClockTime(remainingSeconds)}</div>
              </div>
              <div className="mt-3 text-xl font-semibold text-amber-200">{formatPokerLevel(currentLevel)}</div>
              <div className="mt-1 text-sm text-zinc-400">
                Level {initialState.current_level_index + 1} of {initialState.levels.length}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Button type="button" disabled={isPending} className="gap-2" onClick={() => runControl("start")}>
                <Play className="h-4 w-4" />
                Start
              </Button>
              <Button type="button" disabled={isPending} variant="outline" className="gap-2" onClick={() => runControl("pause")}>
                <Pause className="h-4 w-4" />
                Pause
              </Button>
              <Button type="button" disabled={isPending} variant="outline" className="gap-2" onClick={() => runControl("resume")}>
                <Play className="h-4 w-4" />
                Resume
              </Button>
              <Button type="button" disabled={isPending} variant="outline" className="gap-2" onClick={() => runControl("reset")}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button type="button" disabled={isPending} variant="outline" className="gap-2" onClick={() => runControl("previous")}>
                <SkipBack className="h-4 w-4" />
                Previous
              </Button>
              <Button type="button" disabled={isPending} variant="outline" className="gap-2" onClick={() => runControl("next")}>
                <SkipForward className="h-4 w-4" />
                Next
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader>
            <CardTitle>Tournament numbers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Total entries" value={entries} onChange={setEntries} />
              <NumberField label="Remaining players" value={remainingPlayers} onChange={setRemainingPlayers} />
              <NumberField label="Buy-in stack" value={buyInStack} onChange={setBuyInStack} step={500} />
              <NumberField label="Entry price (€)" value={entryPrice} onChange={setEntryPrice} step={5} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Total chips" value={formatWholeNumber(stats.totalChips)} />
              <Stat label="Average stack" value={formatWholeNumber(stats.averageStack)} />
              <Stat label="Prize pool" value={formatCurrency(stats.prizePool)} />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-amber-500/20 bg-zinc-950/80">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Levels</CardTitle>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setRows((current) => [...current, createBlindRow()])}>
                <Plus className="h-4 w-4" />
                Add blind
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setRows((current) => [...current, createBreakRow()])}>
                <Plus className="h-4 w-4" />
                Add break
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row, index) => (
            <div key={row.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 lg:grid-cols-[5rem_8rem_1fr_1fr_1fr_1fr_auto] lg:items-end">
              <div className="text-sm font-semibold text-zinc-400">#{index + 1}</div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={row.type} onValueChange={(type) => updateRow(setRows, index, { type: type as "blind" | "break" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blind">Blind</SelectItem>
                    <SelectItem value="break">BREAK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <NumberField label="Minutes" value={row.durationMinutes} onChange={(value) => updateRow(setRows, index, { durationMinutes: value })} min={1} />
              {row.type === "break" ? (
                <div className="space-y-2 lg:col-span-3">
                  <Label>Label</Label>
                  <Input value={row.label} onChange={(event) => updateRow(setRows, index, { label: event.target.value })} placeholder="BREAK" />
                </div>
              ) : (
                <>
                  <NumberField label="Small blind" value={row.smallBlind} onChange={(value) => updateRow(setRows, index, { smallBlind: value })} />
                  <NumberField label="Big blind" value={row.bigBlind} onChange={(value) => updateRow(setRows, index, { bigBlind: value })} />
                  <NumberField label="Ante" value={row.ante} onChange={(value) => updateRow(setRows, index, { ante: value })} />
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove level"
                disabled={rows.length === 1}
                onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" disabled={isPending} className="w-full gap-2" onClick={saveConfiguration}>
            <Save className="h-4 w-4" />
            Save configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  step?: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        step={step}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onWheel={(event) => event.currentTarget.blur()}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-zinc-50">{value}</div>
    </div>
  );
}

function levelToRow(level: PokerClockLevel, index: number): LevelRow {
  if (level.type === "break") {
    return {
      id: `initial-${index}`,
      type: "break",
      durationMinutes: String(Math.max(1, Math.round(level.durationSeconds / 60))),
      smallBlind: "",
      bigBlind: "",
      ante: "",
      label: level.label,
    };
  }

  return {
    id: `initial-${index}`,
    type: "blind",
    durationMinutes: String(Math.max(1, Math.round(level.durationSeconds / 60))),
    smallBlind: String(level.smallBlind),
    bigBlind: String(level.bigBlind),
    ante: String(level.ante),
    label: "BREAK",
  };
}

function rowToLevel(row: LevelRow): PokerClockLevel | null {
  const durationSeconds = Math.max(60, Math.floor(Number(row.durationMinutes) || 0) * 60);
  if (row.type === "break") {
    return { type: "break", durationSeconds, label: row.label.trim() || "BREAK" };
  }
  return {
    type: "blind",
    durationSeconds,
    smallBlind: Math.max(0, Math.floor(Number(row.smallBlind) || 0)),
    bigBlind: Math.max(0, Math.floor(Number(row.bigBlind) || 0)),
    ante: Math.max(0, Math.floor(Number(row.ante) || 0)),
  };
}

function createBlindRow(): LevelRow {
  return {
    id: crypto.randomUUID(),
    type: "blind",
    durationMinutes: "20",
    smallBlind: "100",
    bigBlind: "200",
    ante: "100",
    label: "BREAK",
  };
}

function createBreakRow(): LevelRow {
  return {
    id: crypto.randomUUID(),
    type: "break",
    durationMinutes: "10",
    smallBlind: "",
    bigBlind: "",
    ante: "",
    label: "BREAK",
  };
}

function updateRow(setRows: React.Dispatch<React.SetStateAction<LevelRow[]>>, index: number, patch: Partial<LevelRow>) {
  setRows((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
}

function formatWholeNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
