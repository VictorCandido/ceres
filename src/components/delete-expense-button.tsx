"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { deleteExpense } from "@/server/expenses/actions"

interface DeleteExpenseButtonProps {
  expenseId: string
}

export function DeleteExpenseButton({ expenseId }: DeleteExpenseButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm("Excluir este lançamento?")) return

    startTransition(async () => {
      const result = await deleteExpense(expenseId)
      if (result.ok) {
        toast.success("Lançamento excluído.")
      } else {
        toast.error("Erro ao excluir lançamento.")
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:text-destructive"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Excluir lançamento"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}
