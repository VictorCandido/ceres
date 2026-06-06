"use client"

import { useState, useTransition } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateExpense } from "@/server/expenses/actions"
import { parseCents } from "@/lib/money"
import type { ExpenseWithEnvelope } from "@/types"

interface EditExpenseDialogProps {
  expense: ExpenseWithEnvelope
  envelopes: Array<{ id: string; name: string; color: string | null }>
}

export function EditExpenseDialog({ expense, envelopes }: EditExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState(expense.envelopeId)

  const occurredAtDate = new Date(expense.occurredAt).toISOString().slice(0, 10)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const amountCents = parseCents(data.get("amount") as string)
    const envelopeId = data.get("envelopeId") as string
    const description = (data.get("description") as string) || null
    const occurredAt = new Date((data.get("occurredAt") as string) + "T12:00:00")

    startTransition(async () => {
      const result = await updateExpense(expense.id, {
        amountCents,
        envelopeId,
        description,
        occurredAt,
      })
      if (result.ok) {
        toast.success("Lançamento atualizado!")
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
        aria-label="Editar lançamento"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar lançamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor={`amount-${expense.id}`}>Valor (R$)</Label>
              <Input
                id={`amount-${expense.id}`}
                name="amount"
                placeholder="0,00"
                inputMode="decimal"
                defaultValue={(expense.amountCents / 100).toFixed(2).replace(".", ",")}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`envelopeId-${expense.id}`}>Caixinha</Label>
              <Select
                name="envelopeId"
                value={selectedEnvelopeId}
                onValueChange={setSelectedEnvelopeId}
                required
              >
                <SelectTrigger id={`envelopeId-${expense.id}`}>
                  <SelectValue>
                    {envelopes.find((e) => e.id === selectedEnvelopeId)?.name ?? "Selecione..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor={`occurredAt-${expense.id}`}>Data</Label>
              <Input
                id={`occurredAt-${expense.id}`}
                name="occurredAt"
                type="date"
                defaultValue={occurredAtDate}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`description-${expense.id}`}>Descrição (opcional)</Label>
              <Textarea
                id={`description-${expense.id}`}
                name="description"
                placeholder="Ex: Mercado, gasolina..."
                defaultValue={expense.description ?? ""}
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
