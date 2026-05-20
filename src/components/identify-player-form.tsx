"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { identifyPlayer } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActionResult, Player } from "@/lib/types";

export function IdentifyPlayerForm({ players }: { players: Player[] }) {
  const [playerId, setPlayerId] = useState("");
  const [state, setState] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set("playerId", playerId);
        startTransition(async () => {
          const result = await identifyPlayer(formData);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
          setState(result);
        });
      }}
    >
      <div className="space-y-2">
        <Label>Your player</Label>
        <Select value={playerId} onValueChange={setPlayerId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select your player name" />
          </SelectTrigger>
          <SelectContent>
            {players.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                {player.nickname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input name="email" type="email" placeholder="you@example.com" required />
      </div>
      {state ? <p className={state.success ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{state.message}</p> : null}
      <Button type="submit" disabled={isPending || !playerId} className="w-full gap-2">
        <Mail className="h-4 w-4" />
        Send sign-in link
      </Button>
    </form>
  );
}
