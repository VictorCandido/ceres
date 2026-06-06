export const dynamic = "force-dynamic"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MonthNav } from "@/components/month-nav"
import { ExpenseList } from "@/components/expense-list"
import { getExpensesByMonth } from "@/server/expenses/queries"
import { getAllEnvelopes } from "@/server/envelopes/queries"
import { formatBRL } from "@/lib/money"
import { currentReferenceMonth } from "@/lib/date"

interface ExpensesPageProps {
  params: Promise<{ month: string }>
}

export default async function ExpensesPage({ params }: ExpensesPageProps) {
  const { month } = await params

  if (!/^\d{4}-\d{2}$/.test(month)) {
    redirect(`/${currentReferenceMonth()}/expenses`)
  }

  const [expenses, envelopes] = await Promise.all([
    getExpensesByMonth(month),
    getAllEnvelopes(),
  ])

  const total = expenses.reduce((sum, e) => sum + e.amountCents, 0)

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/${month}`} aria-label="Voltar" />}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <MonthNav month={month} basePath="expenses" />
          <div className="w-20" />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Lançamentos</h1>
          {expenses.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">{formatBRL(total)}</span>
            </span>
          )}
        </div>

        <ExpenseList expenses={expenses} envelopes={envelopes} />
      </main>
    </div>
  )
}
