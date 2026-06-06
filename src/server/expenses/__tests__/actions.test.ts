import { describe, it, expect, vi, beforeEach } from "vitest"
import { revalidatePath } from "next/cache"
import {
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/server/expenses/actions"

vi.mock("@/lib/db", () => ({
  db: {
    expense: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock("@/lib/date", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/date")>()
  return {
    ...actual,
    referenceMonthFromDate: vi.fn((date: Date) => {
      // Usa implementação real baseada em UTC simples para testes
      return date.toISOString().slice(0, 7)
    }),
  }
})

import { db } from "@/lib/db"

type MockDb = {
  expense: {
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
}
const mockDb = db as unknown as MockDb

beforeEach(() => {
  vi.clearAllMocks()
  ;(revalidatePath as ReturnType<typeof vi.fn>).mockClear()
})

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000"

describe("createExpense", () => {
  it("cria lançamento com sucesso e retorna id", async () => {
    mockDb.expense.create.mockResolvedValue({ id: "exp-1" })

    const result = await createExpense({
      envelopeId: VALID_UUID,
      amountCents: 5000,
      occurredAt: new Date("2024-06-15T12:00:00Z"),
    })

    expect(result).toEqual({ ok: true, data: { id: "exp-1" } })
    expect(mockDb.expense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          envelopeId: VALID_UUID,
          amountCents: 5000,
        }),
      })
    )
  })

  it("deriva referenceMonth da data quando não informado", async () => {
    mockDb.expense.create.mockResolvedValue({ id: "exp-1" })

    await createExpense({
      envelopeId: VALID_UUID,
      amountCents: 5000,
      occurredAt: new Date("2024-06-15T12:00:00Z"),
    })

    expect(mockDb.expense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ referenceMonth: "2024-06" }),
      })
    )
  })

  it("usa referenceMonth explícito quando fornecido", async () => {
    mockDb.expense.create.mockResolvedValue({ id: "exp-1" })

    await createExpense({
      envelopeId: VALID_UUID,
      amountCents: 5000,
      occurredAt: new Date("2024-06-15T12:00:00Z"),
      referenceMonth: "2024-05", // mês diferente da data
    })

    expect(mockDb.expense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ referenceMonth: "2024-05" }),
      })
    )
  })

  it("salva descrição quando fornecida", async () => {
    mockDb.expense.create.mockResolvedValue({ id: "exp-1" })

    await createExpense({
      envelopeId: VALID_UUID,
      amountCents: 3000,
      description: "Supermercado",
      occurredAt: new Date("2024-06-10T12:00:00Z"),
    })

    expect(mockDb.expense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: "Supermercado" }),
      })
    )
  })

  it("chama revalidatePath após criar", async () => {
    mockDb.expense.create.mockResolvedValue({ id: "exp-1" })

    await createExpense({
      envelopeId: VALID_UUID,
      amountCents: 1000,
      occurredAt: new Date(),
    })

    expect(revalidatePath).toHaveBeenCalledWith("/")
  })

  it("retorna erro para envelopeId inválido (não UUID)", async () => {
    const result = await createExpense({
      envelopeId: "nao-e-uuid",
      amountCents: 5000,
      occurredAt: new Date(),
    })

    expect(result.ok).toBe(false)
    expect(mockDb.expense.create).not.toHaveBeenCalled()
  })

  it("retorna erro para amountCents zero", async () => {
    const result = await createExpense({
      envelopeId: VALID_UUID,
      amountCents: 0,
      occurredAt: new Date(),
    })

    expect(result.ok).toBe(false)
  })

  it("retorna erro para amountCents negativo", async () => {
    const result = await createExpense({
      envelopeId: VALID_UUID,
      amountCents: -500,
      occurredAt: new Date(),
    })

    expect(result.ok).toBe(false)
  })

  it("retorna erro para descrição muito longa (>200 chars)", async () => {
    const result = await createExpense({
      envelopeId: VALID_UUID,
      amountCents: 1000,
      description: "A".repeat(201),
      occurredAt: new Date(),
    })

    expect(result.ok).toBe(false)
  })

  it("retorna erro para referenceMonth inválido", async () => {
    const result = await createExpense({
      envelopeId: VALID_UUID,
      amountCents: 1000,
      occurredAt: new Date(),
      referenceMonth: "2024-13", // mês inválido
    })

    expect(result.ok).toBe(false)
  })

  it("retorna erro para input null", async () => {
    const result = await createExpense(null)

    expect(result.ok).toBe(false)
  })
})

describe("updateExpense", () => {
  it("atualiza valor e descrição com sucesso", async () => {
    mockDb.expense.update.mockResolvedValue({})

    const result = await updateExpense("exp-1", {
      amountCents: 8000,
      description: "Atualizado",
    })

    expect(result).toEqual({ ok: true, data: undefined })
    expect(mockDb.expense.update).toHaveBeenCalledWith({
      where: { id: "exp-1" },
      data: { amountCents: 8000, description: "Atualizado" },
    })
  })

  it("atualiza referenceMonth automaticamente ao mudar occurredAt", async () => {
    mockDb.expense.update.mockResolvedValue({})

    await updateExpense("exp-1", {
      occurredAt: new Date("2024-08-10T12:00:00Z"),
    })

    expect(mockDb.expense.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          referenceMonth: "2024-08",
        }),
      })
    )
  })

  it("não sobrescreve referenceMonth explícito ao mudar occurredAt", async () => {
    mockDb.expense.update.mockResolvedValue({})

    await updateExpense("exp-1", {
      occurredAt: new Date("2024-08-10T12:00:00Z"),
      referenceMonth: "2024-07",
    })

    expect(mockDb.expense.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ referenceMonth: "2024-07" }),
      })
    )
  })

  it("chama revalidatePath após atualizar", async () => {
    mockDb.expense.update.mockResolvedValue({})

    await updateExpense("exp-1", { amountCents: 1000 })

    expect(revalidatePath).toHaveBeenCalledWith("/")
  })

  it("retorna erro para amountCents negativo", async () => {
    const result = await updateExpense("exp-1", { amountCents: -100 })

    expect(result.ok).toBe(false)
    expect(mockDb.expense.update).not.toHaveBeenCalled()
  })
})

describe("deleteExpense", () => {
  it("deleta lançamento com sucesso", async () => {
    mockDb.expense.delete.mockResolvedValue({})

    const result = await deleteExpense("exp-1")

    expect(result).toEqual({ ok: true, data: undefined })
    expect(mockDb.expense.delete).toHaveBeenCalledWith({ where: { id: "exp-1" } })
  })

  it("chama revalidatePath após deletar", async () => {
    mockDb.expense.delete.mockResolvedValue({})

    await deleteExpense("exp-1")

    expect(revalidatePath).toHaveBeenCalledWith("/")
  })
})
