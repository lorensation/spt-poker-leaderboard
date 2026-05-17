"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchPlayersAndGamesAction } from "@/app/actions/search";
import type { Player } from "@/lib/types";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<{
    players: Player[];
    games: Array<{ id: string; title: string; played_at: string }>;
  }>({ players: [], games: [] });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    startTransition(async () => setResults(await searchPlayersAndGamesAction(query)));
  }, [query]);

  return (
    <>
      <Button variant="outline" className="justify-start gap-2 text-zinc-400" onClick={() => setOpen(true)}>
        <Search className="h-4 w-4" />
        Search
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search players or games..." value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>{isPending ? "Searching..." : "No results found."}</CommandEmpty>
          <CommandGroup heading="Players">
            {results.players.map((player) => (
              <CommandItem
                key={player.id}
                onSelect={() => {
                  setOpen(false);
                  router.push(`/players/${encodeURIComponent(player.nickname)}`);
                }}
              >
                {player.nickname}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Games">
            {results.games.map((game) => (
              <CommandItem
                key={game.id}
                onSelect={() => {
                  setOpen(false);
                  router.push(`/games/${game.id}`);
                }}
              >
                {game.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
