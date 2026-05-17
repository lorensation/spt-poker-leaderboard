"use client";

import { useMemo, useState, useTransition } from "react";
import { Send } from "lucide-react";

import { submitVotes, type VoteActionState } from "@/app/actions/votes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Player } from "@/lib/types";
import { validateVoteSelection } from "@/lib/votes";

const TOKEN_KEY = "spt_player_tokens";

export function VoteForm({ gameId, players }: { gameId: string; players: Player[] }) {
  const [voterId, setVoterId] = useState("");
  const [votes, setVotes] = useState(["", "", ""]);
  const [state, setState] = useState<VoteActionState | null>(null);
  const [isPending, startTransition] = useTransition();
  const validation = useMemo(() => (voterId ? validateVoteSelection(voterId, votes) : null), [voterId, votes]);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const stored = JSON.parse(localStorage.getItem(TOKEN_KEY) ?? "{}") as Record<string, string>;
        const formData = new FormData();
        formData.set("gameId", gameId);
        formData.set("voterPlayerId", voterId);
        formData.set("editToken", stored[voterId] ?? "");
        votes.forEach((vote, index) => formData.set(`vote${index + 1}`, vote));
        startTransition(async () => setState(await submitVotes(formData)));
      }}
    >
      <div className="space-y-2">
        <Label>Voting as</Label>
        <PlayerSelect players={players} value={voterId} onChange={setVoterId} placeholder="Select your nickname" />
      </div>
      {[0, 1, 2].map((index) => (
        <div className="space-y-2" key={index}>
          <Label>{index + 1}{index === 0 ? "st" : index === 1 ? "nd" : "rd"} performer</Label>
          <PlayerSelect
            players={players}
            value={votes[index]}
            onChange={(value) => setVotes((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))}
            placeholder="Choose player"
          />
        </div>
      ))}
      {validation && !validation.ok ? <p className="text-sm text-red-300">{validation.error}</p> : null}
      {state ? <p className={state.ok ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{state.message}</p> : null}
      <Button type="submit" disabled={isPending || !voterId || !validation?.ok} className="w-full gap-2">
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
