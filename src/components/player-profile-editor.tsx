"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { editPlayer } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/types";
import type { PlayerStats } from "@/lib/types";

const TOKEN_KEY = "spt_player_tokens";

export function PlayerProfileEditor({ player }: { player: PlayerStats }) {
  const [state, setState] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const stored = JSON.parse(localStorage.getItem(TOKEN_KEY) ?? "{}") as Record<string, string>;
        const formData = new FormData(event.currentTarget);
        formData.set("playerId", player.player_id);
        formData.set("editToken", stored[player.player_id] ?? "");
        startTransition(async () => {
          const result = await editPlayer(formData);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
          setState(result);
        });
      }}
    >
      <div className="space-y-2">
        <Label>Nickname</Label>
        <Input name="nickname" defaultValue={player.nickname} />
      </div>
      <div className="space-y-2">
        <Label>Avatar</Label>
        <Input name="avatar" type="file" accept="image/*" />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <Checkbox name="removeAvatar" />
        Remove avatar
      </label>
      {state ? <p className={state.success ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{state.message}</p> : null}
      <Button type="submit" disabled={isPending} className="w-full gap-2">
        <Pencil className="h-4 w-4" />
        Save profile
      </Button>
    </form>
  );
}
