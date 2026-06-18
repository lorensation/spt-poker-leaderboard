"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CircleDot, Trophy, Users, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import {
  currentPokerClockLevel,
  formatClockTime,
  formatPokerLevel,
  nextPokerClockLevel,
  POKER_CLOCK_ID,
  POKER_CLOCK_POLL_INTERVAL_MS,
  pokerClockStats,
  previousPokerClockLevel,
  remainingSecondsForState,
  normalizePokerClockState,
  type PokerClockLevel,
  type PokerClockState,
} from "@/lib/poker-clock";

export function PokerClockDisplay({ initialState }: { initialState: PokerClockState }) {
  const [state, setState] = useState(initialState);
  const [now, setNow] = useState(() => Date.now());
  const [isLive, setIsLive] = useState(false);
  const currentLevel = currentPokerClockLevel(state);
  const previousLevel = previousPokerClockLevel(state);
  const nextLevel = nextPokerClockLevel(state);
  const stats = useMemo(() => pokerClockStats(state), [state]);
  const remainingSeconds = remainingSecondsForState(state, now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return;

    const supabase = createBrowserSupabase();
    let mounted = true;

    async function refreshState() {
      const { data } = await supabase
        .from("poker_clock_state")
        .select("*")
        .eq("id", POKER_CLOCK_ID)
        .maybeSingle();
      if (mounted && data) setState(normalizePokerClockState(data as Partial<PokerClockState>));
    }

    const channel = supabase
      .channel("poker-clock-state")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poker_clock_state", filter: `id=eq.${POKER_CLOCK_ID}` },
        () => {
          void refreshState();
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    const poller = window.setInterval(() => {
      void refreshState();
    }, POKER_CLOCK_POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      window.clearInterval(poller);
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="relative h-12 w-12 overflow-hidden rounded-lg border border-amber-300/30 bg-zinc-950">
            <Image src="/spt-logo.jpeg" alt="SPT logo" fill sizes="48px" className="object-cover" priority />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">SPT Poker Clock</h1>
            <p className="text-sm text-zinc-400">Texas Hold&apos;em tournament clock</p>
          </div>
        </div>
        <Badge className={isLive ? "bg-emerald-400 text-zinc-950" : "bg-zinc-700 text-zinc-100"}>
          {isLive ? "Live" : "Sync fallback"}
        </Badge>
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.5fr_0.8fr]">
        <LevelPanel label="Previous level" level={previousLevel} muted />

        <Card className="border-amber-500/30 bg-zinc-950/90">
          <CardContent className="flex min-h-[22rem] flex-col items-center justify-center gap-6 p-6 text-center">
            <Badge variant="outline" className="border-amber-400/40 px-3 py-1 text-amber-200">
              Level {state.current_level_index + 1} / {state.levels.length}
            </Badge>
            <div className="font-mono text-7xl font-black leading-none tracking-tight text-zinc-50 sm:text-8xl lg:text-9xl">
              {formatClockTime(remainingSeconds)}
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-amber-200 sm:text-5xl">{formatPokerLevel(currentLevel)}</div>
              <div className="text-sm uppercase tracking-[0.3em] text-zinc-500">{state.status}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <LevelPanel label="Next level" level={nextLevel} />
          <MetricPanel icon={<Users className="h-5 w-5" />} label="Players" value={`${state.remaining_players} / ${state.entries}`} />
          <MetricPanel icon={<Trophy className="h-5 w-5" />} label="Average stack" value={formatWholeNumber(stats.averageStack)} />
          <MetricPanel icon={<CircleDot className="h-5 w-5" />} label="Total chips" value={formatWholeNumber(stats.totalChips)} />
          <MetricPanel icon={<WalletCards className="h-5 w-5" />} label="Prize pool" value={formatCurrency(stats.prizePool)} />
        </div>
      </section>
    </div>
  );
}

function LevelPanel({ label, level, muted = false }: { label: string; level: PokerClockLevel | null; muted?: boolean }) {
  return (
    <Card className={muted ? "border-white/10 bg-zinc-950/50 opacity-80" : "border-amber-500/20 bg-zinc-950/80"}>
      <CardContent className="flex min-h-32 flex-col justify-center p-5">
        <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">{label}</div>
        <div className="mt-3 text-3xl font-bold text-zinc-50">{formatPokerLevel(level)}</div>
        <div className="mt-2 font-mono text-sm text-amber-200">{level ? formatClockTime(level.durationSeconds) : "--:--"}</div>
      </CardContent>
    </Card>
  );
}

function MetricPanel({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.04]">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md bg-amber-400 p-2 text-zinc-950">{icon}</div>
        <div>
          <div className="text-sm text-zinc-400">{label}</div>
          <div className="text-xl font-semibold text-zinc-50">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatWholeNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
