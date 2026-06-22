export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { MonthNav } from "@/components/month-nav"
import { EnvelopeCard } from "@/components/envelope-card"
import { CreateEnvelopeDialog } from "@/components/create-envelope-dialog"
import { getEnvelopesWithBalance } from "@/server/envelopes/queries"
import { getExpensesByMonth } from "@/server/expenses/queries"
import { formatBRL } from "@/lib/money"
import { currentReferenceMonth } from "@/lib/date"
import { Logo } from "@/components/logo"
import { AppFooter } from "@/components/app-footer"
import { ExpensesHistory } from "@/components/expenses-history"
import type { EnvelopeWithBalance } from "@/types"

interface DashboardPageProps {
  params: Promise<{ month: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { month } = await params

  if (!/^\d{4}-\d{2}$/.test(month)) {
    redirect(`/${currentReferenceMonth()}`)
  }

  const [envelopes, expenses] = await Promise.all([
    getEnvelopesWithBalance(month),
    getExpensesByMonth(month),
  ])

  const totalLimit = envelopes.reduce((s: number, e: EnvelopeWithBalance) => s + e.currentLimit, 0)
  const totalSpent = envelopes.reduce((s: number, e: EnvelopeWithBalance) => s + e.totalSpent, 0)
  const totalBalance = totalLimit - totalSpent

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Logo size="sm" />
          <MonthNav month={month} />
          <CreateEnvelopeDialog />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 space-y-6">
        <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p>Total gasto: <span className="font-medium text-foreground">{formatBRL(totalSpent)}</span></p>
            <p>Total disponível: <span className="font-medium text-foreground">{formatBRL(totalLimit)}</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Saldo geral</p>
            <p className={`text-xl font-bold tabular-nums ${totalBalance < 0 ? "text-destructive" : "text-emerald-600"}`}>
              {formatBRL(totalBalance)}
            </p>
          </div>
        </div>

        {envelopes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma caixinha criada ainda.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {envelopes.map((envelope: EnvelopeWithBalance) => (
              <EnvelopeCard key={envelope.id} envelope={envelope} month={month} />
            ))}
          </div>
        )}

        <ExpensesHistory expenses={expenses} />
      </main>
      <AppFooter />
    </div>
  )
}
