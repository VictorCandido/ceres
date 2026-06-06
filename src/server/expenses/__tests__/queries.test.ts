import { describe, it, expect, vi, beforeEach } from "vitest"
import { getExpensesByMonth, getExpensesByEnvelope } from "@/server/expenses/queries"

vi.mock("@/lib/db", () => ({
  db: {
    expense: {
      findMany: vi.fn(),
    },
  },
}))

import { db } from "@/lib/db"

type MockDb = { expense: { findMany: ReturnType<typeof vi.fn> } }
const mockDb = db as unknown as MockDb

function makeExpense(id: string, amountCents: number, referenceMonth = "2024-06") {
  return {
    id,
    envelopeId: "env-1",
    amountCents,
    description: `Gasto ${id}`,
    occurredAt: new Date("2024-06-10T12:00:00Z"),
    referenceMonth,
    createdAt: new Date(),
    updatedAt: new Date(),
    envelope: { id: "env-1", name: "Alimentação", color: "#22c55e" },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getExpensesByMonth", () => {
  it("retorna gastos do mês especificado com envelope", async () => {
    const mock = [makeExpense("e1", 5000), makeExpense("e2", 3000)]
    mockDb.expense.findMany.mockResolvedValue(mock)

    const result = await getExpensesByMonth("2024-06")

    expect(result).toEqual(mock)
    expect(mockDb.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { referenceMonth: "2024-06" },
        orderBy: { occurredAt: "desc" },
        include: { envelope: { select: { id: true, name: true, color: true } } },
      })
    )
  })

  it("retorna lista vazia quando não há gastos no mês", async () => {
    mockDb.expense.findMany.mockResolvedValue([])

    const result = await getExpensesByMonth("2024-01")

    expect(result).toEqual([])
  })
})

describe("getExpensesByEnvelope", () => {
  it("retorna gastos de um envelope específico no mês", async () => {
    const mock = [makeExpense("e1", 4500)]
    mockDb.expense.findMany.mockResolvedValue(mock)

    const result = await getExpensesByEnvelope("env-1", "2024-06")

    expect(result).toEqual(mock)
    expect(mockDb.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { envelopeId: "env-1", referenceMonth: "2024-06" },
        orderBy: { occurredAt: "desc" },
      })
    )
  })
})
