"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
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
import { createExpense } from "@/server/expenses/actions"
import { parseCents } from "@/lib/money"

interface AddExpenseDialogProps {
  envelopes: Array<{ id: string; name: string; color: string | null }>
  month: string
  defaultEnvelopeId?: string
}

export function AddExpenseDialog({ envelopes, defaultEnvelopeId }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const amountCents = parseCents(data.get("amount") as string)
    const envelopeId = data.get("envelopeId") as string
    const description = (data.get("description") as string) || undefined
    const occurredAt = new Date((data.get("occurredAt") as string) + "T12:00:00")

    startTransition(async () => {
      const result = await createExpense({ amountCents, envelopeId, description, occurredAt })
      if (result.ok) {
        toast.success("Lançamento adicionado!")
        setOpen(false)
        form.reset()
      } else {
        toast.error(result.error)
      }
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Novo lançamento"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                name="amount"
                placeholder="0,00"
                inputMode="decimal"
                required
                autoFocus
              />
            </div>

            {defaultEnvelopeId ? (
              <input type="hidden" name="envelopeId" value={defaultEnvelopeId} />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="envelopeId">Caixinha</Label>
                <Select name="envelopeId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
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
            )}

            <div className="space-y-2">
              <Label htmlFor="occurredAt">Data</Label>
              <Input
                id="occurredAt"
                name="occurredAt"
                type="date"
                defaultValue={today}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Ex: Mercado, gasolina..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
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
