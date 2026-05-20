import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, Trophy, Vote, WalletCards } from "lucide-react";

import { Podium } from "@/components/podium";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCurrentPlayer } from "@/lib/auth/player";
import { getLatestOpenGame, getGames, hasPlayerVoted } from "@/lib/queries/games";
import { getTopPlayers } from "@/lib/queries/leaderboards";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string; next?: string }>;
}) {
  const params = await searchParams;
  if (params.code) {
    const next = params.next ?? "/profile";
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}&next=${encodeURIComponent(next)}`);
  }
  if (params.error || params.error_description) {
    redirect(`/auth/callback?error=${encodeURIComponent(params.error ?? "auth_error")}&error_description=${encodeURIComponent(params.error_description ?? params.error ?? "Authentication failed.")}`);
  }

  const [moneyTop, pointsTop, latestOpenGame, games] = await Promise.all([
    getTopPlayers("money"),
    getTopPlayers("points"),
    getLatestOpenGame(),
    getGames(),
  ]);
  const currentPlayer = await getCurrentPlayer();
  const currentPlayerVotedLatest = latestOpenGame && currentPlayer
    ? await hasPlayerVoted(latestOpenGame.id, currentPlayer.playerId)
    : false;
  const latestGame = games[0] ?? null;
  const moneyKing = moneyTop[0] ?? null;
  const performanceMvp = pointsTop[0] ?? null;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <div>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-zinc-50 md:text-6xl">
              SPT Poker Leaderboard
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild><Link href="/leaderboard/money">Money rankings</Link></Button>
            <Button asChild variant="outline"><Link href="/leaderboard/points">Performance rankings</Link></Button>
            <Button asChild variant="outline"><Link href="/games">Game history</Link></Button>
            <Button asChild variant="outline"><Link href="/identify">Player login</Link></Button>
          </div>
        </div>
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardContent className="space-y-3 p-5">
            <div className="text-lg font-semibold">Existing players only</div>
            <p className="text-sm text-zinc-400">
              New players are created by the admin. If your name is already on the leaderboard, identify yourself with your linked email.
            </p>
            <Button asChild className="w-full"><Link href="/identify">Identify player</Link></Button>
          </CardContent>
        </Card>
      </section>

      {latestOpenGame ? (
        <Card className="border-red-500/40 bg-red-950/40">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 font-semibold text-red-100">
                <Vote className="h-5 w-5" />
                Voting is open for {latestOpenGame.title} - {formatDate(latestOpenGame.played_at)}
              </div>
              <p className="mt-1 text-sm text-red-100/80">Vote your top 3 performers of the night.</p>
            </div>
            {currentPlayerVotedLatest ? (
              <div className="rounded-md border border-red-200/20 px-4 py-2 text-sm font-medium text-red-100">Vote submitted</div>
            ) : (
              <Button asChild><Link href={`/vote/${latestOpenGame.id}`}>Vote now</Link></Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Highlight icon={<Crown className="h-5 w-5" />} label="Money king" value={moneyKing ? moneyKing.nickname : "No king yet"} subvalue={moneyKing ? formatCurrency(moneyKing.net_profit) : "Add a game"} />
        <Highlight icon={<Trophy className="h-5 w-5" />} label="Performance MVP" value={performanceMvp ? performanceMvp.nickname : "No MVP yet"} subvalue={performanceMvp ? `${performanceMvp.total_points} points` : "Add votes"} />
        <Highlight icon={<WalletCards className="h-5 w-5" />} label="Latest night" value={latestGame ? latestGame.title : "No games yet"} subvalue={latestGame ? formatDate(latestGame.played_at) : "Create one in admin"} />
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Top 3 Money</h2>
          <Podium players={moneyTop} kind="money" />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Top 3 Performance</h2>
          <Podium players={pointsTop} kind="points" />
        </div>
      </section>
    </div>
  );
}

function Highlight({ icon, label, value, subvalue }: { icon: React.ReactNode; label: string; value: string; subvalue: string }) {
  return (
    <Card className="border-amber-500/20 bg-zinc-950/80">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-md bg-amber-400 p-3 text-zinc-950">{icon}</div>
        <div>
          <div className="text-sm text-zinc-400">{label}</div>
          <div className="font-semibold">{value}</div>
          <div className="text-sm text-amber-200">{subvalue}</div>
        </div>
      </CardContent>
    </Card>
  );
}
