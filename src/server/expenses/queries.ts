"use server"

import { db } from "@/lib/db"
import type { ExpenseWithEnvelope } from "@/types"

export async function getExpensesByMonth(
  month: string
): Promise<ExpenseWithEnvelope[]> {
  return db.expense.findMany({
    where: { referenceMonth: month },
    orderBy: { occurredAt: "desc" },
    include: {
      envelope: { select: { id: true, name: true, color: true } },
    },
  })
}

export async function getExpensesByEnvelope(
  envelopeId: string,
  month: string
): Promise<ExpenseWithEnvelope[]> {
  return db.expense.findMany({
    where: { envelopeId, referenceMonth: month },
    orderBy: { occurredAt: "desc" },
    include: {
      envelope: { select: { id: true, name: true, color: true } },
    },
  })
}
