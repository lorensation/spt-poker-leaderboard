"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { createPlayer, type PlayerActionData } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { captureSubmittedForm } from "@/lib/form-submission";
import type { ActionResult } from "@/lib/types";

const TOKEN_KEY = "spt_player_tokens";

export function JoinPlayerForm() {
  const [state, setState] = useState<ActionResult<PlayerActionData> | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        const submission = captureSubmittedForm(event.currentTarget);
        startTransition(async () => {
          const result = await createPlayer(submission.formData);
          if (result.success && result.data?.playerId && result.data.token) {
            const stored = JSON.parse(localStorage.getItem(TOKEN_KEY) ?? "{}") as Record<string, string>;
            stored[result.data.playerId] = result.data.token;
            localStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
            submission.form.reset();
            toast.success(result.message);
          } else {
            toast.error(result.message);
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
        <p className={state.success ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{state.message}</p>
      ) : null}
    </form>
  );
}
