import { notFound } from "next/navigation";

import { VoteForm } from "@/components/vote-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getGameDetail } from "@/lib/queries/games";

export default async function VotePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = await getGameDetail(gameId);
  if (!game) notFound();
  const players = game.results.map((result) => result.players);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vote top 3 performers</h1>
        <p className="mt-2 text-zinc-400">{game.title} · {formatDate(game.played_at)}</p>
      </div>
      <Card className="border-amber-500/20 bg-zinc-950/80">
        <CardHeader>
          <CardTitle>{game.status === "voting_open" ? "Voting is open" : "Voting is closed"}</CardTitle>
        </CardHeader>
        <CardContent>
          {game.status === "voting_open" ? (
            <VoteForm gameId={game.id} players={players} />
          ) : (
            <p className="text-zinc-400">Voting is not open for this game.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
