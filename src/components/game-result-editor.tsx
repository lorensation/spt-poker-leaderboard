"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateGameResult } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GameResult, Player } from "@/lib/types";

export function GameResultEditor({
  gameId,
  result,
}: {
  gameId: string;
  result: GameResult & { players: Player };
}) {
  const [finishPosition, setFinishPosition] = useState(result.finish_position === null ? "nq" : String(result.finish_position));
  const [moneySpent, setMoneySpent] = useState(String(result.money_spent ?? 0));
  const [moneyEarned, setMoneyEarned] = useState(String(result.money_earned ?? 0));
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[1fr_repeat(3,8rem)_auto] md:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.set("resultId", result.id);
        formData.set("gameId", gameId);
        formData.set("finish_position", finishPosition);
        formData.set("money_spent", moneySpent);
        formData.set("money_earned", moneyEarned);
        startTransition(async () => {
          const response = await updateGameResult(formData);
          if (response.success) toast.success(response.message);
          else toast.error(response.message);
        });
      }}
    >
      <div className="font-medium">{result.players.nickname}</div>
      <Select value={finishPosition} onValueChange={setFinishPosition}>
        <SelectTrigger aria-label="Finish position">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((position) => (
            <SelectItem key={position} value={String(position)}>
              #{position}
            </SelectItem>
          ))}
          <SelectItem value="nq">NQ</SelectItem>
        </SelectContent>
      </Select>
      <MoneyInput value={moneySpent} onChange={setMoneySpent} label="Money spent" />
      <MoneyInput value={moneyEarned} onChange={setMoneyEarned} label="Money earned" />
      <Button size="sm" disabled={isPending}>Save</Button>
    </form>
  );
}

function MoneyInput({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <Input
      aria-label={label}
      type="number"
      min={0}
      step={5}
      inputMode="numeric"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onWheel={(event) => event.currentTarget.blur()}
      onBlur={() => {
        if (value === "" || Number(value) < 0) onChange("0");
      }}
    />
  );
}
