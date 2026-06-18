import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminPokerClockForm } from "@/components/admin-poker-clock-form";
import { Button } from "@/components/ui/button";
import { isAdminSession } from "@/lib/security/admin";
import { getPokerClockState } from "@/lib/queries/poker-clock";

export default async function AdminPokerClockPage() {
  const isAdmin = await isAdminSession();
  if (!isAdmin) redirect("/admin");

  const state = await getPokerClockState();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Poker Clock Admin</h1>
          <p className="mt-2 text-zinc-400">Configure levels, tournament numbers, and the public tournament clock.</p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
            Admin dashboard
          </Link>
        </Button>
      </div>
      <AdminPokerClockForm initialState={state} />
    </div>
  );
}
