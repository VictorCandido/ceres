"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Archive } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { archiveEnvelope } from "@/server/envelopes/actions"

interface ArchiveEnvelopeButtonProps {
  id: string
  name: string
  redirectTo?: string
}

export function ArchiveEnvelopeButton({ id, name, redirectTo }: ArchiveEnvelopeButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!confirm(`Arquivar "${name}"? Os lançamentos existentes serão preservados.`)) return

    startTransition(async () => {
      const result = await archiveEnvelope(id)
      if (result.ok) {
        toast.success(`"${name}" arquivada.`)
        if (redirectTo) router.push(redirectTo)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleClick} disabled={isPending}>
      <Archive className="h-4 w-4" />
    </Button>
  )
}
