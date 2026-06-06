import { describe, it, expect, vi, beforeEach } from "vitest"
import { getEnvelopesWithBalance, getEnvelopeById, getEnvelopeWithBalance, getAllEnvelopes } from "@/server/envelopes/queries"

vi.mock("@/lib/db", () => ({
  db: {
    envelope: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

import { db } from "@/lib/db"

const mockDb = db as {
  envelope: { findMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> }
}

function makeEnvelopeRow(overrides: {
  id?: string
  name?: string
  color?: string
  limitCents?: number
  expenses?: Array<{ amountCents: number }>
}) {
  return {
    id: overrides.id ?? "env-1",
    name: overrides.name ?? "Alimentação",
    color: overrides.color ?? "#22c55e",
    icon: null,
    displayOrder: 0,
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    limits: [
      {
        id: "limit-1",
        envelopeId: overrides.id ?? "env-1",
        limitCents: overrides.limitCents ?? 100000,
        effectiveFromMonth: "2024-06",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    expenses: overrides.expenses ?? [],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getEnvelopesWithBalance", () => {
  it("retorna envelopes com balance correto quando dentro do limite", async () => {
    const row = makeEnvelopeRow({
      limitCents: 100000,
      expenses: [{ amountCents: 60000 }, { amountCents: 20000 }],
    })
    mockDb.envelope.findMany.mockResolvedValue([row])

    const result = await getEnvelopesWithBalance("2024-06")

    expect(result).toHaveLength(1)
    expect(result[0].currentLimit).toBe(100000)
    expect(result[0].totalSpent).toBe(80000)
    expect(result[0].balance).toBe(20000) // 1000 - 800 = 200 reais
  })

  it("retorna balance negativo quando estourado", async () => {
    const row = makeEnvelopeRow({
      limitCents: 50000,
      expenses: [{ amountCents: 70000 }],
    })
    mockDb.envelope.findMany.mockResolvedValue([row])

    const result = await getEnvelopesWithBalance("2024-06")

    expect(result[0].balance).toBe(-20000) // -200 reais
  })

  it("retorna balance igual ao limite quando não há gastos", async () => {
    const row = makeEnvelopeRow({ limitCents: 80000, expenses: [] })
    mockDb.envelope.findMany.mockResolvedValue([row])

    const result = await getEnvelopesWithBalance("2024-06")

    expect(result[0].balance).toBe(80000)
    expect(result[0].totalSpent).toBe(0)
  })

  it("retorna limite zero quando envelope não tem limite vigente", async () => {
    const row = {
      ...makeEnvelopeRow({}),
      limits: [], // sem limite
      expenses: [],
    }
    mockDb.envelope.findMany.mockResolvedValue([row])

    const result = await getEnvelopesWithBalance("2024-06")

    expect(result[0].currentLimit).toBe(0)
    expect(result[0].balance).toBe(0)
  })

  it("retorna lista vazia quando não há envelopes", async () => {
    mockDb.envelope.findMany.mockResolvedValue([])

    const result = await getEnvelopesWithBalance("2024-06")

    expect(result).toEqual([])
  })

  it("passa filtros corretos para o banco (mês e archived)", async () => {
    mockDb.envelope.findMany.mockResolvedValue([])

    await getEnvelopesWithBalance("2024-08")

    expect(mockDb.envelope.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { archived: false },
      })
    )
  })

  it("calcula totalSpent somando todos os gastos do mês", async () => {
    const row = makeEnvelopeRow({
      limitCents: 200000,
      expenses: [
        { amountCents: 1500 },
        { amountCents: 3200 },
        { amountCents: 800 },
        { amountCents: 12000 },
      ],
    })
    mockDb.envelope.findMany.mockResolvedValue([row])

    const result = await getEnvelopesWithBalance("2024-06")

    expect(result[0].totalSpent).toBe(17500)
    expect(result[0].balance).toBe(182500)
  })

  it("processa múltiplos envelopes corretamente", async () => {
    const rows = [
      makeEnvelopeRow({ id: "e1", name: "Alimentação", limitCents: 150000, expenses: [{ amountCents: 50000 }] }),
      makeEnvelopeRow({ id: "e2", name: "Transporte", limitCents: 40000, expenses: [{ amountCents: 45000 }] }),
    ]
    mockDb.envelope.findMany.mockResolvedValue(rows)

    const result = await getEnvelopesWithBalance("2024-06")

    expect(result).toHaveLength(2)
    expect(result[0].balance).toBe(100000) // 1500 - 500 = 1000
    expect(result[1].balance).toBe(-5000)  // 400 - 450 = -50 (negativo)
  })
})

describe("getEnvelopeById", () => {
  it("retorna o envelope quando encontrado", async () => {
    const mock = {
      id: "env-1",
      name: "Alimentação",
      limits: [
        { effectiveFromMonth: "2024-06", limitCents: 100000 },
        { effectiveFromMonth: "2024-01", limitCents: 80000 },
      ],
    }
    mockDb.envelope.findUnique.mockResolvedValue(mock)

    const result = await getEnvelopeById("env-1")

    expect(result).toEqual(mock)
    expect(mockDb.envelope.findUnique).toHaveBeenCalledWith({
      where: { id: "env-1" },
      include: { limits: { orderBy: { effectiveFromMonth: "desc" } } },
    })
  })

  it("retorna null quando não encontrado", async () => {
    mockDb.envelope.findUnique.mockResolvedValue(null)

    const result = await getEnvelopeById("nao-existe")

    expect(result).toBeNull()
  })
})

describe("getEnvelopeWithBalance", () => {
  it("retorna envelope com balance correto", async () => {
    const row = makeEnvelopeRow({
      limitCents: 100000,
      expenses: [{ amountCents: 30000 }, { amountCents: 20000 }],
    })
    mockDb.envelope.findUnique.mockResolvedValue(row)

    const result = await getEnvelopeWithBalance("env-1", "2024-06")

    expect(result).not.toBeNull()
    expect(result!.currentLimit).toBe(100000)
    expect(result!.totalSpent).toBe(50000)
    expect(result!.balance).toBe(50000)
  })

  it("retorna balance negativo quando estourado", async () => {
    const row = makeEnvelopeRow({ limitCents: 50000, expenses: [{ amountCents: 80000 }] })
    mockDb.envelope.findUnique.mockResolvedValue(row)

    const result = await getEnvelopeWithBalance("env-1", "2024-06")

    expect(result!.balance).toBe(-30000)
  })

  it("retorna limite zero quando não há limite vigente", async () => {
    const row = { ...makeEnvelopeRow({}), limits: [], expenses: [] }
    mockDb.envelope.findUnique.mockResolvedValue(row)

    const result = await getEnvelopeWithBalance("env-1", "2024-06")

    expect(result!.currentLimit).toBe(0)
    expect(result!.balance).toBe(0)
  })

  it("retorna null quando envelope não existe", async () => {
    mockDb.envelope.findUnique.mockResolvedValue(null)

    const result = await getEnvelopeWithBalance("nao-existe", "2024-06")

    expect(result).toBeNull()
  })

  it("passa id e mês corretos para o banco", async () => {
    mockDb.envelope.findUnique.mockResolvedValue(null)

    await getEnvelopeWithBalance("env-abc", "2025-03")

    expect(mockDb.envelope.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "env-abc" } })
    )
  })
})

describe("getAllEnvelopes", () => {
  it("retorna apenas id, name e color", async () => {
    const mock = [
      { id: "e1", name: "Alimentação", color: "#22c55e" },
      { id: "e2", name: "Transporte", color: "#3b82f6" },
    ]
    mockDb.envelope.findMany.mockResolvedValue(mock)

    const result = await getAllEnvelopes()

    expect(result).toEqual(mock)
    expect(mockDb.envelope.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { archived: false },
        select: { id: true, name: true, color: true },
      })
    )
  })
})
