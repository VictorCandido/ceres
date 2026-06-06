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
import { createEnvelope } from "@/server/envelopes/actions"
import { parseCents } from "@/lib/money"

const COLORS = [
  "#22c55e", "#3b82f6", "#ec4899", "#f59e0b",
  "#8b5cf6", "#06b6d4", "#ef4444", "#6b7280",
]

export function CreateEnvelopeDialog() {
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState(COLORS[0])
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const name = data.get("name") as string
    const limitCents = parseCents(data.get("limit") as string)

    startTransition(async () => {
      const result = await createEnvelope({ name, color, limitCents })
      if (result.ok) {
        toast.success("Caixinha criada!")
        setOpen(false)
        form.reset()
        setColor(COLORS[0])
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nova caixinha
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova caixinha</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" placeholder="Ex: Alimentação" required autoFocus />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Limite mensal (R$)</Label>
              <Input
                id="limit"
                name="limit"
                placeholder="0,00"
                inputMode="decimal"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""}`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? "Criando..." : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
