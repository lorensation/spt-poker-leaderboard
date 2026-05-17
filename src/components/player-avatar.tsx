import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

export function PlayerAvatar({
  nickname,
  avatarUrl,
  className,
}: {
  nickname: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("border border-amber-300/30 bg-emerald-950", className)}>
      <AvatarImage src={avatarUrl ?? undefined} alt={nickname} />
      <AvatarFallback className="bg-emerald-950 text-amber-200">
        {initials(nickname)}
      </AvatarFallback>
    </Avatar>
  );
}
