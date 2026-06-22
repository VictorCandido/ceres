import { formatBRL } from "@/lib/money"
import { formatDateBR } from "@/lib/date"
import type { ExpenseWithEnvelope } from "@/types"

interface ExpensesHistoryProps {
  expenses: ExpenseWithEnvelope[]
}

export function ExpensesHistory({ expenses }: ExpensesHistoryProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Histórico de lançamentos
        </h2>
        <span className="text-xs text-muted-foreground">
          {expenses.length} {expenses.length === 1 ? "lançamento" : "lançamentos"}
        </span>
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhum lançamento neste mês.
        </div>
      ) : (
        <ul className="space-y-2">
          {expenses.map((expense) => (
            <li
              key={expense.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <span
                className="h-2 w-2 rounded-full flex-shrink-0 mt-0.5"
                style={{ backgroundColor: expense.envelope.color ?? "#6b7280" }}
                aria-hidden="true"
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-snug">
                  {expense.description || expense.envelope.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {expense.envelope.name}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateBR(new Date(expense.occurredAt))}
                  </span>
                </div>
              </div>

              <span className="font-semibold tabular-nums text-sm flex-shrink-0">
                {formatBRL(expense.amountCents)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
