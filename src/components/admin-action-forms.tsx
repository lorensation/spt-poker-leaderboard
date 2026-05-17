"use client";

import { useState, useTransition } from "react";
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
import type { GameCardData, GameStatus, Player } from "@/lib/types";

export function AdminCreatePlayerForm() {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await adminCreatePlayer(formData);
          if (result.success) {
            toast.success(result.message);
            event.currentTarget.reset();
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
        <Label>Avatar</Label>
        <Input name="avatar" type="file" accept="image/*" />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">Create player</Button>
      <p className="text-xs text-zinc-500">Public player creation returns an edit token to the browser. Admin-created players can be managed here.</p>
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

export function AdminPlayerActions({ player }: { player: Player }) {
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <form
        className="grid gap-3 lg:grid-cols-[auto_1fr_1fr_auto_auto] lg:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          formData.set("removeAvatar", removeAvatar ? "on" : "");
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
        <Input name="avatar" type="file" accept="image/*" />
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <Checkbox checked={removeAvatar} onCheckedChange={(checked) => setRemoveAvatar(checked === true)} />
          Remove avatar
        </label>
        <Button size="sm" disabled={isPending}>Save</Button>
      </form>
      <div className="flex justify-end">
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
