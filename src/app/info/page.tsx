import { Card, CardContent } from "@/components/ui/card";

export default function InfoPage() {
  return (
    <Card className="mx-auto max-w-3xl border-amber-500/20 bg-zinc-950/80">
      <CardContent className="prose prose-invert max-w-none p-6">
        <h1>Poker Night Rules</h1>
        <h2>Buy-in</h2>
        <p>20€ buy-in<br />10€ rebuy<br />10€ addon</p>
        <h2>Starting stack</h2>
        <p>Each player starts with 2,000 points, equivalent to 100 big blinds.</p>
        <p>Chip distribution:</p>
        <ul>
          <li>2 chips of 500</li>
          <li>7 chips of 100</li>
          <li>4 chips of 50</li>
          <li>10 chips of 10</li>
        </ul>
        <h2>Blind levels</h2>
        <p>Levels every 15 or 20 minutes.</p>
        <p>First level: 10 / 20</p>
        <h2>Addon</h2>
        <p>10€ addon = 3,000 points</p>
        <h2>Prizes</h2>
        <p>Usually 4 or 5 paid positions depending on the total pot.</p>
        <h2>WhatsApp group</h2>
        <p><a href="YOUR_LINK_HERE">Join the WhatsApp group</a></p>
        <h2>Equipment</h2>
        <ul>
          <li>Poker table</li>
          <li>Chips</li>
          <li>Cards</li>
          <li>Timer</li>
          <li>Dealer button</li>
          <li>Blind structure</li>
        </ul>
      </CardContent>
    </Card>
  );
}
