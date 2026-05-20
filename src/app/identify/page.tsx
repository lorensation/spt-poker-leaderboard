import Link from "next/link";

import { logoutPlayer } from "@/app/actions/auth";
import { IdentifyPlayerForm } from "@/components/identify-player-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentPlayer } from "@/lib/auth/player";
import { getPlayers } from "@/lib/queries/players";

export default async function IdentifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [players, currentPlayer, params] = await Promise.all([getPlayers(), getCurrentPlayer(), searchParams]);

  if (currentPlayer) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader>
            <CardTitle>Signed in as {currentPlayer.player.nickname}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full"><Link href="/profile">Open profile</Link></Button>
            <form action={logoutPlayer}>
              <Button type="submit" variant="outline" className="w-full">Sign out</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-amber-500/20 bg-zinc-950/80">
        <CardHeader>
          <CardTitle>Identify player</CardTitle>
          <p className="text-sm text-zinc-400">Select your existing player name and enter the email linked by the admin.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.error ? <p className="text-sm text-red-300">{decodeURIComponent(params.error)}</p> : null}
          <IdentifyPlayerForm players={players} />
          <p className="text-xs text-zinc-500">If your name or email is missing, contact the admin. This page cannot create new players.</p>
        </CardContent>
      </Card>
    </div>
  );
}
