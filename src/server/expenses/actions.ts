"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { referenceMonthFromDate } from "@/lib/date"
import type { ActionResult } from "@/types"

const createExpenseSchema = z.object({
  envelopeId: z.string().uuid("Envelope inválido"),
  amountCents: z.number().int().positive("Valor deve ser positivo"),
  description: z.string().max(200).optional(),
  occurredAt: z.coerce.date(),
  referenceMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido").optional(),
})

const updateExpenseSchema = z.object({
  envelopeId: z.string().uuid().optional(),
  amountCents: z.number().int().positive().optional(),
  description: z.string().max(200).optional().nullable(),
  occurredAt: z.coerce.date().optional(),
  referenceMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
})

export async function createExpense(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createExpenseSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const { envelopeId, amountCents, description, occurredAt } = parsed.data
  const referenceMonth = parsed.data.referenceMonth ?? referenceMonthFromDate(occurredAt)

  const expense = await db.expense.create({
    data: { envelopeId, amountCents, description, occurredAt, referenceMonth },
  })

  revalidatePath("/")
  return { ok: true, data: { id: expense.id } }
}

export async function updateExpense(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const parsed = updateExpenseSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const data = { ...parsed.data }
  if (data.occurredAt && !parsed.data.referenceMonth) {
    Object.assign(data, { referenceMonth: referenceMonthFromDate(data.occurredAt) })
  }

  await db.expense.update({ where: { id }, data })
  revalidatePath("/")
  return { ok: true, data: undefined }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  await db.expense.delete({ where: { id } })
  revalidatePath("/")
  return { ok: true, data: undefined }
}
