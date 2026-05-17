import { BadgeEuro, CircleDollarSign, Club, Dices, MessageCircle, ShieldCheck, Spade, Timer, Trophy, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const chipDistribution = ["2 chips of 500", "7 chips of 100", "4 chips of 50", "10 chips of 10"];
const equipment = ["Poker table", "Chips", "Cards", "Timer", "Dealer button", "Blind structure"];

export default function InfoPage() {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL;

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-amber-500/20 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_24rem),linear-gradient(135deg,rgba(6,78,59,0.6),rgba(9,9,11,0.95))] p-6">
        <Badge className="bg-amber-400 text-zinc-950">Poker Night Rules</Badge>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">SPT table rules, buy-ins, chips, and house notes</h1>
        <p className="mt-4 max-w-2xl text-zinc-300">A clean reference for every game night, styled for the same private poker-room feel as the leaderboard.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <RuleCard icon={<BadgeEuro />} title="Buy-in" value="20€" detail="Initial seat at the table." />
        <RuleCard icon={<CircleDollarSign />} title="Rebuy" value="10€" detail="Available during the rebuy window." />
        <RuleCard icon={<Spade />} title="Addon" value="10€" detail="Addon grants 3,000 points." />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Dices className="h-5 w-5 text-amber-300" />Starting Stack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-300">
            <p>Each player starts with 2,000 points, equivalent to 100 big blinds.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {chipDistribution.map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm">{item}</div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-zinc-950/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5 text-amber-300" />Blind Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-zinc-300">
            <p>Levels every 15 or 20 minutes.</p>
            <div className="rounded-md border border-emerald-500/20 bg-emerald-950/40 p-4">
              <div className="text-sm text-zinc-400">First level</div>
              <div className="font-mono text-2xl font-bold text-amber-200">10 / 20</div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <RuleCard icon={<Trophy />} title="Prize Structure" value="4 or 5 paid" detail="Depends on total pot and turnout." />
        <Card className="border-amber-500/20 bg-zinc-950/80 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-amber-300" />WhatsApp Group</CardTitle>
          </CardHeader>
          <CardContent>
            {whatsappUrl ? (
              <Button asChild className="w-full">
                <a href={whatsappUrl} target="_blank" rel="noreferrer">Join the WhatsApp group</a>
              </Button>
            ) : (
              <Button disabled variant="outline" className="w-full">WhatsApp group link coming soon.</Button>
            )}
          </CardContent>
        </Card>
        <RuleCard icon={<ShieldCheck />} title="House Rules / Notes" value="Friendly table" detail="Respect the host, settle payments, and keep the night moving." />
      </section>

      <Card className="border-amber-500/20 bg-zinc-950/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Club className="h-5 w-5 text-amber-300" />Equipment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 text-zinc-300">
              <Users className="h-4 w-4 text-emerald-300" />
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function RuleCard({ icon, title, value, detail }: { icon: React.ReactNode; title: string; value: string; detail: string }) {
  return (
    <Card className="border-amber-500/20 bg-zinc-950/80">
      <CardContent className="flex gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-amber-400 text-zinc-950 [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
        <div>
          <div className="text-sm text-zinc-400">{title}</div>
          <div className="text-xl font-semibold text-zinc-50">{value}</div>
          <div className="mt-1 text-sm text-zinc-400">{detail}</div>
        </div>
      </CardContent>
    </Card>
  );
}
