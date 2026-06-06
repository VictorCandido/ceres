"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { login } from "./actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const from = searchParams.get("from") ?? "/"

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return login(formData)
    },
    null
  )

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Ceres</h1>
          <p className="text-sm text-muted-foreground">Digite a senha para continuar</p>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="from" value={from} />
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoFocus
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  )
}
