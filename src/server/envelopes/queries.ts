"use server"

import { db } from "@/lib/db"
import type { EnvelopeWithBalance, EnvelopeWithLimits } from "@/types"

export async function getEnvelopesWithBalance(
  month: string
): Promise<EnvelopeWithBalance[]> {
  const envelopes = await db.envelope.findMany({
    where: { archived: false },
    orderBy: { displayOrder: "asc" },
    include: {
      limits: {
        where: { effectiveFromMonth: { lte: month } },
        orderBy: { effectiveFromMonth: "desc" },
        take: 1,
      },
      expenses: {
        where: { referenceMonth: month },
      },
    },
  })

  return envelopes.map((env) => {
    const currentLimit = env.limits[0]?.limitCents ?? 0
    const totalSpent = env.expenses.reduce((sum, e) => sum + e.amountCents, 0)
    return {
      ...env,
      currentLimit,
      totalSpent,
      balance: currentLimit - totalSpent,
    }
  })
}

export async function getEnvelopeById(id: string): Promise<EnvelopeWithLimits | null> {
  return db.envelope.findUnique({
    where: { id },
    include: {
      limits: { orderBy: { effectiveFromMonth: "desc" } },
    },
  })
}

export async function getEnvelopeWithBalance(
  id: string,
  month: string
): Promise<EnvelopeWithBalance | null> {
  const envelope = await db.envelope.findUnique({
    where: { id },
    include: {
      limits: {
        where: { effectiveFromMonth: { lte: month } },
        orderBy: { effectiveFromMonth: "desc" },
        take: 1,
      },
      expenses: {
        where: { referenceMonth: month },
      },
    },
  })
  if (!envelope) return null
  const currentLimit = envelope.limits[0]?.limitCents ?? 0
  const totalSpent = envelope.expenses.reduce((sum, e) => sum + e.amountCents, 0)
  return {
    ...envelope,
    currentLimit,
    totalSpent,
    balance: currentLimit - totalSpent,
  }
}

export async function getAllEnvelopes() {
  return db.envelope.findMany({
    where: { archived: false },
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true, color: true },
  })
}
