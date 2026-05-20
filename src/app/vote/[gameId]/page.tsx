import Link from "next/link";
import { notFound } from "next/navigation";

import { VoteForm } from "@/components/vote-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { requireCurrentPlayer } from "@/lib/auth/player";
import { getGameDetail } from "@/lib/queries/games";

export default async function VotePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const [game, currentPlayer] = await Promise.all([getGameDetail(gameId), requireCurrentPlayer()]);
  if (!game) notFound();
  const players = game.results.map((result) => result.players);
  const currentGamePlayer = players.find((player) => player.id === currentPlayer.playerId);
  const currentPlayerVoted = game.votes.some((vote) => vote.voter_player_id === currentPlayer.playerId);

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
          {game.status !== "voting_open" ? (
            <p className="text-zinc-400">Voting is not open for this game.</p>
          ) : currentPlayerVoted ? (
            <div className="space-y-3">
              <p className="text-zinc-400">You already submitted your vote for this game.</p>
              <Button asChild><Link href="/games">Back to games</Link></Button>
            </div>
          ) : currentGamePlayer ? (
            <VoteForm gameId={game.id} players={players} currentPlayer={currentGamePlayer} />
          ) : (
            <div className="space-y-3">
              <p className="text-zinc-400">Only players recorded in this game can vote.</p>
              <Button asChild variant="outline"><Link href="/profile">Back to profile</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
