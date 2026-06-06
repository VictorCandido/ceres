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
import { updateEnvelope, updateEnvelopeLimit } from "@/server/envelopes/actions"
import { parseCents, centsToBRL } from "@/lib/money"
import { currentReferenceMonth } from "@/lib/date"

const COLORS = [
  "#22c55e", "#3b82f6", "#ec4899", "#f59e0b",
  "#8b5cf6", "#06b6d4", "#ef4444", "#6b7280",
]

interface EditEnvelopeDialogProps {
  envelope: {
    id: string
    name: string
    color: string | null
    currentLimit: number
  }
}

export function EditEnvelopeDialog({ envelope }: EditEnvelopeDialogProps) {
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState(envelope.color ?? COLORS[0])
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const name = data.get("name") as string
    const limitCents = parseCents(data.get("limit") as string)

    startTransition(async () => {
      const [r1, r2] = await Promise.all([
        updateEnvelope(envelope.id, { name, color }),
        updateEnvelopeLimit(envelope.id, limitCents, currentReferenceMonth()),
      ])
      if (r1.ok && r2.ok) {
        toast.success("Caixinha atualizada!")
        setOpen(false)
      } else {
        toast.error(!r1.ok ? r1.error : !r2.ok ? r2.error : "Erro desconhecido")
      }
    })
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar caixinha</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input id="edit-name" name="name" defaultValue={envelope.name} required autoFocus />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-limit">Limite mensal (R$)</Label>
              <Input
                id="edit-limit"
                name="limit"
                defaultValue={centsToBRL(envelope.currentLimit).toFixed(2).replace(".", ",")}
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
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
