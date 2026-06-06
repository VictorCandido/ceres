import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { BalanceBadge } from "@/components/balance-badge"
import { formatBRL } from "@/lib/money"
import type { EnvelopeWithBalance } from "@/types"

interface EnvelopeCardProps {
  envelope: EnvelopeWithBalance
  month: string
}

export function EnvelopeCard({ envelope, month }: EnvelopeCardProps) {
  const pct = envelope.currentLimit > 0
    ? Math.min(Math.round((envelope.totalSpent / envelope.currentLimit) * 100), 100)
    : 0
  const isOver = envelope.balance < 0

  return (
    <Link href={`/${month}/envelopes/${envelope.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
      <Card className="flex flex-col gap-0 overflow-hidden transition-colors hover:bg-accent/50 cursor-pointer">
        <CardHeader className="flex flex-row items-center gap-3 pb-2 pt-4 px-4">
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: envelope.color ?? "#6b7280" }}
          />
          <span className="font-medium truncate flex-1">{envelope.name}</span>
          <BalanceBadge balance={envelope.balance} />
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-2">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isOver ? "bg-destructive" : "bg-emerald-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Gasto: {formatBRL(envelope.totalSpent)}</span>
            <span>Limite: {formatBRL(envelope.currentLimit)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
