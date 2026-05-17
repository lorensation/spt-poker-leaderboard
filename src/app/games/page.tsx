import { GameCard } from "@/components/game-card";
import { getGames } from "@/lib/queries/games";

export default async function GamesPage() {
  const games = await getGames();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historical Games</h1>
        <p className="mt-2 text-zinc-400">Poker night results, winners, pots, and voting status.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
      {games.length === 0 ? (
        <div className="rounded-lg border border-dashed border-amber-500/20 p-10 text-center text-zinc-400">
          No games yet. Create the first poker night in the admin panel.
        </div>
      ) : null}
    </div>
  );
}
