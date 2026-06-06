"use server"

import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

export async function login(formData: FormData): Promise<{ error: string } | null> {
  const password = formData.get("password")?.toString() ?? ""

  if (password !== process.env.CERES_PASSWORD) {
    return { error: "Senha incorreta" }
  }

  const session = await getSession()
  session.authenticated = true
  await session.save()

  const from = formData.get("from")?.toString() ?? "/"
  redirect(from.startsWith("/") ? from : "/")
}

export async function logout(): Promise<void> {
  const session = await getSession()
  session.destroy()
  redirect("/login")
}
