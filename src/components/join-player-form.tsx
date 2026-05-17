"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";

import { createPlayer, type ActionState } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TOKEN_KEY = "spt_player_tokens";

export function JoinPlayerForm() {
  const [state, setState] = useState<ActionState | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await createPlayer(formData);
          if (result.ok && result.playerId && result.token) {
            const stored = JSON.parse(localStorage.getItem(TOKEN_KEY) ?? "{}") as Record<string, string>;
            stored[result.playerId] = result.token;
            localStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
            event.currentTarget.reset();
          }
          setState(result);
        });
      }}
    >
      <Input name="nickname" placeholder="Create player nickname" minLength={2} maxLength={32} required />
      <Button type="submit" disabled={isPending} className="gap-2">
        <UserPlus className="h-4 w-4" />
        Join
      </Button>
      {state ? (
        <p className={state.ok ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{state.message}</p>
      ) : null}
    </form>
  );
}
