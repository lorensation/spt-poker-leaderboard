import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type MoneyValueVariant = "spent" | "earned" | "net";

export function MoneyValue({
  value,
  variant,
  className,
}: {
  value: number | null | undefined;
  variant: MoneyValueVariant;
  className?: string;
}) {
  const amount = Number(value ?? 0);

  return (
    <span className={cn("font-mono", moneyValueClass(amount, variant), className)}>
      {formatCurrency(amount)}
    </span>
  );
}

function moneyValueClass(amount: number, variant: MoneyValueVariant) {
  if (amount === 0) return "text-zinc-50";
  if (variant === "spent") return "text-red-300";
  if (variant === "earned") return "text-emerald-300";
  return amount > 0 ? "text-emerald-300" : "text-red-300";
}
