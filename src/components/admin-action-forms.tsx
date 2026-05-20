"use client";

import { useMemo, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteGame, resetVotes, setGameStatus } from "@/app/actions/admin";
import { adminCreatePlayer, adminDeletePlayer, adminUpdatePlayer } from "@/app/actions/players";
import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { captureSubmittedForm } from "@/lib/form-submission";
import type { GameCardData, GameStatus, Player, PlayerIdentity } from "@/lib/types";

export function AdminCreatePlayerForm() {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const submission = captureSubmittedForm(event.currentTarget);
        startTransition(async () => {
          const result = await adminCreatePlayer(submission.formData);
          if (result.success) {
            toast.success(result.message);
            submission.form.reset();
          } else {
            toast.error(result.message);
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label>Nickname</Label>
        <Input name="nickname" required minLength={2} maxLength={32} />
      </div>
      <div className="space-y-2">
        <Label>Email for player login</Label>
        <Input name="email" type="email" placeholder="player@example.com" />
      </div>
      <div className="space-y-2">
        <Label>Avatar</Label>
        <Input name="avatar" type="file" accept="image/*" />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">Create player</Button>
      <p className="text-xs text-zinc-500">Players can only sign in after an admin creates them and links an email.</p>
    </form>
  );
}

export function AdminGameActions({ game }: { game: GameCardData }) {
  const [status, setStatus] = useState<GameStatus>(game.status);
  const [isPending, startTransition] = useTransition();

  function runAction(action: "status" | "reset" | "delete") {
    const formData = new FormData();
    formData.set("gameId", game.id);
    if (action === "status") formData.set("status", status);

    startTransition(async () => {
      const result =
        action === "status"
          ? await setGameStatus(formData)
          : action === "reset"
            ? await resetVotes(formData)
            : await deleteGame(formData);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="grid gap-2 lg:grid-cols-[auto_auto_auto]">
      <div className="flex gap-2">
        <Select value={status} onValueChange={(value) => setStatus(value as GameStatus)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">draft</SelectItem>
            <SelectItem value="voting_open">voting open</SelectItem>
            <SelectItem value="voting_closed">voting closed</SelectItem>
            <SelectItem value="completed">completed</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => runAction("status")}>Save</Button>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => runAction("reset")}>Reset votes</Button>
      <Button type="button" size="sm" variant="destructive" disabled={isPending} className="gap-2" onClick={() => runAction("delete")}>
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
    </div>
  );
}

export function AdminPlayersList({ players, identities }: { players: Player[]; identities: PlayerIdentity[] }) {
  const [query, setQuery] = useState("");
  const identitiesByPlayerId = useMemo(() => new Map(identities.map((identity) => [identity.player_id, identity])), [identities]);
  const filteredPlayers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return players;
    return players.filter((player) => player.nickname.toLowerCase().includes(search));
  }, [players, query]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Search players</Label>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by nickname" />
      </div>
      {filteredPlayers.map((player) => (
        <AdminPlayerActions key={player.id} player={player} identity={identitiesByPlayerId.get(player.id)} />
      ))}
      {players.length === 0 ? <p className="text-sm text-zinc-400">No players yet.</p> : null}
      {players.length > 0 && filteredPlayers.length === 0 ? <p className="text-sm text-zinc-400">No players found.</p> : null}
    </div>
  );
}

export function AdminPlayerActions({ player, identity }: { player: Player; identity?: PlayerIdentity }) {
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [resetIdentity, setResetIdentity] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <form
        className="grid gap-3 lg:grid-cols-[auto_1fr_1fr_1fr_auto_auto] lg:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          formData.set("removeAvatar", removeAvatar ? "on" : "");
          formData.set("resetIdentity", resetIdentity ? "on" : "");
          startTransition(async () => {
            const result = await adminUpdatePlayer(formData);
            if (result.success) toast.success(result.message);
            else toast.error(result.message);
          });
        }}
      >
        <PlayerAvatar nickname={player.nickname} avatarUrl={player.avatar_url} className="h-10 w-10" />
        <input type="hidden" name="playerId" value={player.id} />
        <Input name="nickname" defaultValue={player.nickname} />
        <Input name="email" type="email" defaultValue={identity?.email ?? ""} placeholder="login email" />
        <Input name="avatar" type="file" accept="image/*" />
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Checkbox checked={removeAvatar} onCheckedChange={(checked) => setRemoveAvatar(checked === true)} />
          Remove avatar
        </label>
        <Button size="sm" disabled={isPending}>Save</Button>
      </form>
      <div className="flex flex-col gap-2 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {identity?.email ? (
            identity.claimed_at ? `Claimed ${new Date(identity.claimed_at).toLocaleDateString()}` : "Email linked, not claimed yet"
          ) : (
            "No login email linked"
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Checkbox checked={resetIdentity} onCheckedChange={(checked) => setResetIdentity(checked === true)} disabled={!identity?.email} />
          Reset login claim
        </label>
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          className="gap-2"
          onClick={() => {
            const formData = new FormData();
            formData.set("playerId", player.id);
            startTransition(async () => {
              const result = await adminDeletePlayer(formData);
              if (result.success) toast.success(result.message);
              else toast.error(result.message);
            });
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete player
        </Button>
      </div>
    </div>
  );
}
