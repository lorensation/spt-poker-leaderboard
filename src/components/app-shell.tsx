import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";

import { GlobalSearch } from "@/components/global-search";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/leaderboard/money", label: "Money" },
  { href: "/leaderboard/points", label: "Performance" },
  { href: "/games", label: "Games" },
  { href: "/info", label: "Info" },
  { href: "/admin", label: "Admin" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_28rem),linear-gradient(135deg,#031711,#09090b_55%,#180707)] text-zinc-50">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="relative h-9 w-9 overflow-hidden rounded-md border border-amber-300/30 bg-zinc-950">
              <Image
                src="/spt-logo.jpeg"
                alt="SPT Poker Leaderboard logo"
                fill
                sizes="36px"
                className="object-cover"
                priority
              />
            </span>
            <span>SPT Poker Leaderboard</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Button key={item.href} asChild variant="ghost" size="sm">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="border-amber-500/20 bg-zinc-950 text-zinc-50">
              <div className="mt-8 grid gap-2">
                <GlobalSearch />
                {navItems.map((item) => (
                  <Button key={item.href} asChild variant="ghost" className="justify-start">
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
