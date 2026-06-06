import { formatBRL } from "@/lib/money"
import { cn } from "@/lib/utils"

interface BalanceBadgeProps {
  balance: number
  className?: string
}

export function BalanceBadge({ balance, className }: BalanceBadgeProps) {
  const isNegative = balance < 0
  return (
    <span
      className={cn(
        "text-sm font-semibold tabular-nums",
        isNegative ? "text-destructive" : "text-emerald-600 dark:text-emerald-400",
        className
      )}
    >
      {formatBRL(balance)}
    </span>
  )
}
