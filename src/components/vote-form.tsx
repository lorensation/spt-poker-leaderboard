"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { submitVotes } from "@/app/actions/votes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActionResult, Player } from "@/lib/types";
import { validateVoteSelection } from "@/lib/votes";

export function VoteForm({ gameId, players, currentPlayer }: { gameId: string; players: Player[]; currentPlayer: Player }) {
  const router = useRouter();
  const [votes, setVotes] = useState(["", "", ""]);
  const [state, setState] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const validation = useMemo(() => validateVoteSelection(currentPlayer.id, votes), [currentPlayer.id, votes]);
  const voteOptions = useMemo(() => players.filter((player) => player.id !== currentPlayer.id), [players, currentPlayer.id]);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.set("gameId", gameId);
        votes.forEach((vote, index) => formData.set(`vote${index + 1}`, vote));
        startTransition(async () => {
          const result = await submitVotes(formData);
          if (result.success) {
            toast.success(result.message);
            router.push("/games");
          } else {
            toast.error(result.message);
          }
          setState(result);
        });
      }}
    >
      <div className="space-y-2">
        <Label>Voting as</Label>
        <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">{currentPlayer.nickname}</div>
      </div>
      {[0, 1, 2].map((index) => (
        <div className="space-y-2" key={index}>
          <Label>{index + 1}{index === 0 ? "st" : index === 1 ? "nd" : "rd"} performer</Label>
          <PlayerSelect
            players={voteOptions}
            value={votes[index]}
            onChange={(value) => setVotes((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))}
            placeholder="Choose player"
          />
        </div>
      ))}
      {validation && !validation.ok ? <p className="text-sm text-red-300">{validation.error}</p> : null}
      {state ? <p className={state.success ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{state.message}</p> : null}
      <Button type="submit" disabled={isPending || !validation.ok} className="w-full gap-2">
        <Send className="h-4 w-4" />
        Submit votes
      </Button>
    </form>
  );
}

function PlayerSelect({
  players,
  value,
  onChange,
  placeholder,
}: {
  players: Player[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {players.map((player) => (
          <SelectItem key={player.id} value={player.id}>
            {player.nickname}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
