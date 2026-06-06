"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { currentReferenceMonth } from "@/lib/date"
import type { ActionResult } from "@/types"

const createEnvelopeSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(50),
  color: z.string().optional(),
  limitCents: z.number().int().positive("Limite deve ser positivo"),
})

const updateEnvelopeSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
})

export async function createEnvelope(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = createEnvelopeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const { name, color, limitCents } = parsed.data
  const month = currentReferenceMonth()

  const maxOrder = await db.envelope.aggregate({ _max: { displayOrder: true } })
  const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1

  const envelope = await db.envelope.create({
    data: {
      name,
      color,
      displayOrder,
      limits: { create: { limitCents, effectiveFromMonth: month } },
    },
  })

  revalidatePath("/")
  return { ok: true, data: { id: envelope.id } }
}

export async function updateEnvelope(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const parsed = updateEnvelopeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  await db.envelope.update({ where: { id }, data: parsed.data })
  revalidatePath("/")
  revalidatePath("/envelopes")
  return { ok: true, data: undefined }
}

export async function updateEnvelopeLimit(
  envelopeId: string,
  limitCents: number,
  month?: string
): Promise<ActionResult> {
  const targetMonth = month ?? currentReferenceMonth()

  if (!Number.isInteger(limitCents) || limitCents <= 0) {
    return { ok: false, error: "Limite inválido" }
  }

  await db.envelopeLimit.upsert({
    where: { envelopeId_effectiveFromMonth: { envelopeId, effectiveFromMonth: targetMonth } },
    create: { envelopeId, limitCents, effectiveFromMonth: targetMonth },
    update: { limitCents },
  })

  revalidatePath("/")
  revalidatePath("/envelopes")
  return { ok: true, data: undefined }
}

export async function archiveEnvelope(id: string): Promise<ActionResult> {
  await db.envelope.update({ where: { id }, data: { archived: true } })
  revalidatePath("/")
  revalidatePath("/envelopes")
  return { ok: true, data: undefined }
}

export async function reorderEnvelopes(ids: string[]): Promise<ActionResult> {
  await db.$transaction(
    ids.map((id, index) =>
      db.envelope.update({ where: { id }, data: { displayOrder: index } })
    )
  )
  revalidatePath("/")
  return { ok: true, data: undefined }
}
