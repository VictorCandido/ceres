"use client"

import { useState } from "react"
import { formatBRL } from "@/lib/money"
import { formatDateBR } from "@/lib/date"
import { EditExpenseDialog } from "@/components/edit-expense-dialog"
import { DeleteExpenseButton } from "@/components/delete-expense-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ExpenseWithEnvelope } from "@/types"

interface ExpenseListProps {
  expenses: ExpenseWithEnvelope[]
  envelopes: Array<{ id: string; name: string; color: string | null }>
}

export function ExpenseList({ expenses, envelopes }: ExpenseListProps) {
  const [filterEnvelopeId, setFilterEnvelopeId] = useState<string>("all")

  const filtered =
    filterEnvelopeId === "all"
      ? expenses
      : expenses.filter((e) => e.envelopeId === filterEnvelopeId)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={filterEnvelopeId} onValueChange={(value) => { if (value !== null) setFilterEnvelopeId(value) }}>
          <SelectTrigger className="w-52" aria-label="Filtrar por caixinha">
            <SelectValue>
              {filterEnvelopeId === "all"
                ? "Todas as caixinhas"
                : envelopes.find((e) => e.id === filterEnvelopeId)?.name ?? "Todas as caixinhas"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as caixinhas</SelectItem>
            {envelopes.map((env) => (
              <SelectItem key={env.id} value={env.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full inline-block"
                    style={{ backgroundColor: env.color ?? "#6b7280" }}
                  />
                  {env.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "lançamento" : "lançamentos"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum lançamento neste mês.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((expense) => (
            <li
              key={expense.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: expense.envelope.color ?? "#6b7280" }}
                  />
                  <span className="text-sm font-medium truncate">
                    {expense.description || expense.envelope.name}
                  </span>
                  {expense.description && (
                    <span className="text-xs text-muted-foreground truncate">
                      {expense.envelope.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 ml-4">
                  {formatDateBR(new Date(expense.occurredAt))}
                </p>
              </div>

              <span className="font-semibold tabular-nums text-sm flex-shrink-0">
                {formatBRL(expense.amountCents)}
              </span>

              <div className="flex items-center gap-1 flex-shrink-0">
                <EditExpenseDialog expense={expense} envelopes={envelopes} />
                <DeleteExpenseButton expenseId={expense.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
