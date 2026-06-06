export const dynamic = "force-dynamic"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CreateEnvelopeDialog } from "@/components/create-envelope-dialog"
import { db } from "@/lib/db"
import { formatBRL } from "@/lib/money"
import { currentReferenceMonth } from "@/lib/date"
import type { Envelope, EnvelopeLimit } from "@/types"

type EnvelopeRow = Envelope & {
  limits: EnvelopeLimit[]
  currentLimit: number
}

async function getEnvelopesForSettings(): Promise<EnvelopeRow[]> {
  const month = currentReferenceMonth()
  const envelopes = await db.envelope.findMany({
    where: { archived: false },
    orderBy: { displayOrder: "asc" },
    include: {
      limits: {
        where: { effectiveFromMonth: { lte: month } },
        orderBy: { effectiveFromMonth: "desc" },
        take: 1,
      },
    },
  })
  return envelopes.map((e) => ({
    ...e,
    currentLimit: e.limits[0]?.limitCents ?? 0,
  }))
}

export default async function EnvelopesPage() {
  const envelopes = await getEnvelopesForSettings()

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/" aria-label="Voltar" />}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold flex-1">Caixinhas</h1>
        <CreateEnvelopeDialog />
      </div>

      <Separator />

      {envelopes.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhuma caixinha criada ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {envelopes.map((env: EnvelopeRow) => (
            <li
              key={env.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: env.color ?? "#6b7280" }}
              />
              <span className="flex-1 font-medium truncate">{env.name}</span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatBRL(env.currentLimit)}/mês
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
