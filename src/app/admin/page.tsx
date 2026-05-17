import { AlertTriangle, LogOut, Trash2 } from "lucide-react";

import { adminCreatePlayer, adminDeletePlayer, adminUpdatePlayer } from "@/app/actions/players";
import { deleteGame, loginAdmin, logoutAdmin, resetVotes, setGameStatus } from "@/app/actions/admin";
import { AdminGameForm } from "@/components/admin-game-form";
import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isAdminSession } from "@/lib/security/admin";
import { isAdminSupabaseConfigured } from "@/lib/supabase/server";
import { getGames } from "@/lib/queries/games";
import { getPlayers } from "@/lib/queries/players";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const isAdmin = await isAdminSession();

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader>
            <CardTitle>Admin access</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={loginAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label>Password</Label>
                <Input name="password" type="password" required />
              </div>
              {params.error ? <p className="text-sm text-red-300">Invalid admin password.</p> : null}
              <Button type="submit" className="w-full">Enter admin panel</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [players, games] = await Promise.all([getPlayers(), getGames()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-zinc-400">Create games, manage players, voting, and historical results.</p>
        </div>
        <form action={logoutAdmin}>
          <Button variant="outline" className="gap-2"><LogOut className="h-4 w-4" />Log out</Button>
        </form>
      </div>

      {!isAdminSupabaseConfigured() ? (
        <Card className="border-red-500/40 bg-red-950/40">
          <CardContent className="flex gap-3 p-4 text-red-100">
            <AlertTriangle className="h-5 w-5" />
            Configure Supabase environment variables before using admin mutations.
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader><CardTitle>Create poker night</CardTitle></CardHeader>
          <CardContent><AdminGameForm players={players} /></CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader><CardTitle>Create player</CardTitle></CardHeader>
          <CardContent>
            <form action={adminCreatePlayer} className="space-y-3">
              <div className="space-y-2">
                <Label>Nickname</Label>
                <Input name="nickname" required minLength={2} maxLength={32} />
              </div>
              <div className="space-y-2">
                <Label>Avatar</Label>
                <Input name="avatar" type="file" accept="image/*" />
              </div>
              <Button type="submit" className="w-full">Create player</Button>
              <p className="text-xs text-zinc-500">Public player creation returns an edit token to the browser. Admin-created players can be managed here.</p>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader><CardTitle>Manage games</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {games.map((game) => (
              <div key={game.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
                <div>
                  <div className="font-semibold">{game.title}</div>
                  <div className="text-sm text-zinc-400">{game.played_at} · {game.player_count} players</div>
                </div>
                <form action={setGameStatus} className="flex gap-2">
                  <input type="hidden" name="gameId" value={game.id} />
                  <StatusSelect current={game.status} />
                  <Button size="sm" variant="outline">Save</Button>
                </form>
                <form action={resetVotes}>
                  <input type="hidden" name="gameId" value={game.id} />
                  <Button size="sm" variant="outline">Reset votes</Button>
                </form>
                <form action={deleteGame}>
                  <input type="hidden" name="gameId" value={game.id} />
                  <Button size="sm" variant="destructive" className="gap-2"><Trash2 className="h-4 w-4" />Delete</Button>
                </form>
              </div>
            ))}
            {games.length === 0 ? <p className="text-sm text-zinc-400">No games yet.</p> : null}
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader><CardTitle>Manage players</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {players.map((player) => (
              <div key={player.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <form action={adminUpdatePlayer} className="grid gap-3 lg:grid-cols-[auto_1fr_1fr_auto_auto] lg:items-center">
                  <PlayerAvatar nickname={player.nickname} avatarUrl={player.avatar_url} className="h-10 w-10" />
                  <input type="hidden" name="playerId" value={player.id} />
                  <Input name="nickname" defaultValue={player.nickname} />
                  <Input name="avatar" type="file" accept="image/*" />
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <Checkbox name="removeAvatar" />
                    Remove avatar
                  </label>
                  <Button size="sm">Save</Button>
                </form>
                <form action={adminDeletePlayer} className="flex justify-end">
                  <input type="hidden" name="playerId" value={player.id} />
                  <Button size="sm" variant="destructive" className="gap-2"><Trash2 className="h-4 w-4" />Delete player</Button>
                </form>
              </div>
            ))}
            {players.length === 0 ? <p className="text-sm text-zinc-400">No players yet.</p> : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatusSelect({ current }: { current: string }) {
  return (
    <Select name="status" defaultValue={current}>
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
  );
}
