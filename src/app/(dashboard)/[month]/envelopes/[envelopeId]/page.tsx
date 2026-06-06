export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BalanceBadge } from "@/components/balance-badge"
import { AddExpenseDialog } from "@/components/add-expense-dialog"
import { EditEnvelopeDialog } from "@/components/edit-envelope-dialog"
import { ArchiveEnvelopeButton } from "@/components/archive-envelope-button"
import { EditExpenseDialog } from "@/components/edit-expense-dialog"
import { DeleteExpenseButton } from "@/components/delete-expense-button"
import { getEnvelopeWithBalance, getAllEnvelopes } from "@/server/envelopes/queries"
import { getExpensesByEnvelope } from "@/server/expenses/queries"
import { formatBRL } from "@/lib/money"
import { formatDateBR, currentReferenceMonth } from "@/lib/date"

interface EnvelopePageProps {
  params: Promise<{ month: string; envelopeId: string }>
}

export default async function EnvelopePage({ params }: EnvelopePageProps) {
  const { month, envelopeId } = await params

  if (!/^\d{4}-\d{2}$/.test(month)) {
    redirect(`/${currentReferenceMonth()}`)
  }

  const [envelope, expenses, allEnvelopes] = await Promise.all([
    getEnvelopeWithBalance(envelopeId, month),
    getExpensesByEnvelope(envelopeId, month),
    getAllEnvelopes(),
  ])

  if (!envelope) notFound()

  const total = expenses.reduce((sum, e) => sum + e.amountCents, 0)

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Button variant="ghost" size="icon" nativeButton={false} render={<Link href={`/${month}`} aria-label="Voltar" />}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: envelope.color ?? "#6b7280" }}
            />
            <span className="font-semibold truncate">{envelope.name}</span>
          </div>
          <EditEnvelopeDialog envelope={envelope} />
          <ArchiveEnvelopeButton id={envelope.id} name={envelope.name} redirectTo={`/${month}`} />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 space-y-6">
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p>Gasto: <span className="font-medium text-foreground">{formatBRL(envelope.totalSpent)}</span></p>
              <p>Limite: <span className="font-medium text-foreground">{formatBRL(envelope.currentLimit)}/mês</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Saldo</p>
              <BalanceBadge balance={envelope.balance} />
            </div>
          </div>

          {envelope.currentLimit > 0 && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${envelope.balance < 0 ? "bg-destructive" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(Math.round((envelope.totalSpent / envelope.currentLimit) * 100), 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Lançamentos
            {expenses.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {formatBRL(total)}
              </span>
            )}
          </h2>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum lançamento neste mês.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {expense.description || envelope.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateBR(new Date(expense.occurredAt))}
                  </p>
                </div>
                <span className="font-semibold tabular-nums text-sm shrink-0">
                  {formatBRL(expense.amountCents)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <EditExpenseDialog expense={expense} envelopes={allEnvelopes} />
                  <DeleteExpenseButton expenseId={expense.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <div className="fixed bottom-6 right-6">
        <AddExpenseDialog
          envelopes={allEnvelopes}
          month={month}
          defaultEnvelopeId={envelopeId}
        />
      </div>
    </div>
  )
}
