import Link from "next/link";
import { Crown, Trophy, Vote, WalletCards } from "lucide-react";

import { JoinPlayerForm } from "@/components/join-player-form";
import { Podium } from "@/components/podium";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { getLatestOpenGame, getGames } from "@/lib/queries/games";
import { getTopPlayers } from "@/lib/queries/leaderboards";

export default async function Home() {
  const [moneyTop, pointsTop, latestOpenGame, games] = await Promise.all([
    getTopPlayers("money"),
    getTopPlayers("points"),
    getLatestOpenGame(),
    getGames(),
  ]);
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
            <p className="mt-4 max-w-2xl text-lg text-zinc-300">
              Track money, MVP votes, historical results, and long-term bragging rights without player accounts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild><Link href="/leaderboard/money">Money rankings</Link></Button>
            <Button asChild variant="outline"><Link href="/leaderboard/points">Performance rankings</Link></Button>
            <Button asChild variant="outline"><Link href="/games">Game history</Link></Button>
          </div>
        </div>
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader>
            <CardTitle>Create player profile</CardTitle>
          </CardHeader>
          <CardContent>
            <JoinPlayerForm />
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
            <Button asChild><Link href={`/vote/${latestOpenGame.id}`}>Vote now</Link></Button>
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
