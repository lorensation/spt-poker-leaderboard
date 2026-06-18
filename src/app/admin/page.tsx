import Link from "next/link";
import { AlertTriangle, Clock, LogOut } from "lucide-react";

import { loginAdmin, logoutAdmin } from "@/app/actions/admin";
import { AdminCreatePlayerForm, AdminGameActions, AdminPlayersList } from "@/components/admin-action-forms";
import { AdminGameForm } from "@/components/admin-game-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAdminSession } from "@/lib/security/admin";
import { isAdminSupabaseConfigured } from "@/lib/supabase/server";
import { getGames } from "@/lib/queries/games";
import { getPlayerIdentities, getPlayers } from "@/lib/queries/players";

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

  const [players, games, identities] = await Promise.all([getPlayers(), getGames(), getPlayerIdentities()]);

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

      <Card className="border-amber-500/20 bg-zinc-950/80">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="h-5 w-5 text-amber-200" />
              Poker Clock
            </div>
            <p className="mt-1 text-sm text-zinc-400">Configure and control the public tournament clock.</p>
          </div>
          <Button asChild>
            <Link href="/admin/clock-partida">Open clock admin</Link>
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader><CardTitle>Create poker night</CardTitle></CardHeader>
          <CardContent><AdminGameForm players={players} /></CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader><CardTitle>Create player</CardTitle></CardHeader>
          <CardContent>
            <AdminCreatePlayerForm />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader><CardTitle>Manage games</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {games.map((game) => (
              <div key={game.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="font-semibold">{game.title}</div>
                  <div className="text-sm text-zinc-400">{game.played_at} · {game.player_count} players</div>
                </div>
                <AdminGameActions game={game} />
              </div>
            ))}
            {games.length === 0 ? <p className="text-sm text-zinc-400">No games yet.</p> : null}
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader><CardTitle>Manage players</CardTitle></CardHeader>
          <CardContent>
            <AdminPlayersList players={players} identities={identities} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
