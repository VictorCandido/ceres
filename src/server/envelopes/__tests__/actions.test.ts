import { describe, it, expect, vi, beforeEach } from "vitest"
import { revalidatePath } from "next/cache"
import {
  createEnvelope,
  updateEnvelope,
  updateEnvelopeLimit,
  archiveEnvelope,
  reorderEnvelopes,
} from "@/server/envelopes/actions"

vi.mock("@/lib/db", () => ({
  db: {
    envelope: {
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    envelopeLimit: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/date", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/date")>()
  return {
    ...actual,
    currentReferenceMonth: vi.fn(() => "2024-06"),
  }
})

import { db } from "@/lib/db"

type MockDb = {
  envelope: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; aggregate: ReturnType<typeof vi.fn> }
  envelopeLimit: { upsert: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}
const mockDb = db as unknown as MockDb

beforeEach(() => {
  vi.clearAllMocks()
  ;(revalidatePath as ReturnType<typeof vi.fn>).mockClear()
})

describe("createEnvelope", () => {
  it("cria envelope com sucesso e retorna id", async () => {
    mockDb.envelope.aggregate.mockResolvedValue({ _max: { displayOrder: 2 } })
    mockDb.envelope.create.mockResolvedValue({ id: "new-id", name: "Alimentação" })

    const result = await createEnvelope({ name: "Alimentação", color: "#22c55e", limitCents: 150000 })

    expect(result).toEqual({ ok: true, data: { id: "new-id" } })
    expect(mockDb.envelope.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Alimentação",
          color: "#22c55e",
          displayOrder: 3,
        }),
      })
    )
  })

  it("define displayOrder como 0 quando não há envelopes", async () => {
    mockDb.envelope.aggregate.mockResolvedValue({ _max: { displayOrder: null } })
    mockDb.envelope.create.mockResolvedValue({ id: "id-1" })

    await createEnvelope({ name: "Alimentação", limitCents: 100000 })

    expect(mockDb.envelope.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ displayOrder: 0 }),
      })
    )
  })

  it("cria o primeiro limite com o mês atual", async () => {
    mockDb.envelope.aggregate.mockResolvedValue({ _max: { displayOrder: null } })
    mockDb.envelope.create.mockResolvedValue({ id: "id-1" })

    await createEnvelope({ name: "Alimentação", limitCents: 100000 })

    expect(mockDb.envelope.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          limits: { create: { limitCents: 100000, effectiveFromMonth: "2024-06" } },
        }),
      })
    )
  })

  it("chama revalidatePath após criar", async () => {
    mockDb.envelope.aggregate.mockResolvedValue({ _max: { displayOrder: null } })
    mockDb.envelope.create.mockResolvedValue({ id: "id-1" })

    await createEnvelope({ name: "Test", limitCents: 100000 })

    expect(revalidatePath).toHaveBeenCalledWith("/")
  })

  it("retorna erro quando nome está vazio", async () => {
    const result = await createEnvelope({ name: "", limitCents: 100000 })

    expect(result).toEqual({ ok: false, error: expect.stringContaining("") })
    expect(mockDb.envelope.create).not.toHaveBeenCalled()
  })

  it("retorna erro quando nome excede 50 caracteres", async () => {
    const result = await createEnvelope({
      name: "A".repeat(51),
      limitCents: 100000,
    })

    expect(result.ok).toBe(false)
  })

  it("retorna erro quando limitCents é zero", async () => {
    const result = await createEnvelope({ name: "Test", limitCents: 0 })

    expect(result.ok).toBe(false)
    expect(mockDb.envelope.create).not.toHaveBeenCalled()
  })

  it("retorna erro quando limitCents é negativo", async () => {
    const result = await createEnvelope({ name: "Test", limitCents: -100 })

    expect(result.ok).toBe(false)
  })

  it("retorna erro para input inválido (não-objeto)", async () => {
    const result = await createEnvelope(null)

    expect(result.ok).toBe(false)
  })
})

describe("updateEnvelope", () => {
  it("atualiza nome e cor com sucesso", async () => {
    mockDb.envelope.update.mockResolvedValue({})

    const result = await updateEnvelope("env-1", { name: "Novo Nome", color: "#ff0000" })

    expect(result).toEqual({ ok: true, data: undefined })
    expect(mockDb.envelope.update).toHaveBeenCalledWith({
      where: { id: "env-1" },
      data: { name: "Novo Nome", color: "#ff0000" },
    })
  })

  it("chama revalidatePath nas rotas corretas", async () => {
    mockDb.envelope.update.mockResolvedValue({})

    await updateEnvelope("env-1", { name: "Novo" })

    expect(revalidatePath).toHaveBeenCalledWith("/")
    expect(revalidatePath).toHaveBeenCalledWith("/envelopes")
  })

  it("retorna erro para nome inválido", async () => {
    const result = await updateEnvelope("env-1", { name: "A".repeat(51) })

    expect(result.ok).toBe(false)
    expect(mockDb.envelope.update).not.toHaveBeenCalled()
  })
})

describe("updateEnvelopeLimit", () => {
  it("faz upsert do limite no mês especificado", async () => {
    mockDb.envelopeLimit.upsert.mockResolvedValue({})

    const result = await updateEnvelopeLimit("env-1", 200000, "2024-07")

    expect(result).toEqual({ ok: true, data: undefined })
    expect(mockDb.envelopeLimit.upsert).toHaveBeenCalledWith({
      where: { envelopeId_effectiveFromMonth: { envelopeId: "env-1", effectiveFromMonth: "2024-07" } },
      create: { envelopeId: "env-1", limitCents: 200000, effectiveFromMonth: "2024-07" },
      update: { limitCents: 200000 },
    })
  })

  it("usa mês atual quando não especificado", async () => {
    mockDb.envelopeLimit.upsert.mockResolvedValue({})

    await updateEnvelopeLimit("env-1", 150000)

    expect(mockDb.envelopeLimit.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ effectiveFromMonth: "2024-06" }),
      })
    )
  })

  it("retorna erro quando limitCents é zero", async () => {
    const result = await updateEnvelopeLimit("env-1", 0)

    expect(result.ok).toBe(false)
    expect(mockDb.envelopeLimit.upsert).not.toHaveBeenCalled()
  })

  it("retorna erro quando limitCents é negativo", async () => {
    const result = await updateEnvelopeLimit("env-1", -1000)

    expect(result.ok).toBe(false)
  })

  it("retorna erro quando limitCents não é inteiro", async () => {
    const result = await updateEnvelopeLimit("env-1", 1000.5)

    expect(result.ok).toBe(false)
  })
})

describe("archiveEnvelope", () => {
  it("arquiva o envelope com sucesso", async () => {
    mockDb.envelope.update.mockResolvedValue({})

    const result = await archiveEnvelope("env-1")

    expect(result).toEqual({ ok: true, data: undefined })
    expect(mockDb.envelope.update).toHaveBeenCalledWith({
      where: { id: "env-1" },
      data: { archived: true },
    })
  })

  it("chama revalidatePath em ambas as rotas", async () => {
    mockDb.envelope.update.mockResolvedValue({})

    await archiveEnvelope("env-1")

    expect(revalidatePath).toHaveBeenCalledWith("/")
    expect(revalidatePath).toHaveBeenCalledWith("/envelopes")
  })
})

describe("reorderEnvelopes", () => {
  it("executa transação com displayOrder correto", async () => {
    mockDb.$transaction.mockResolvedValue([])
    mockDb.envelope.update.mockResolvedValue({})

    const result = await reorderEnvelopes(["id-a", "id-b", "id-c"])

    expect(result).toEqual({ ok: true, data: undefined })
    expect(mockDb.$transaction).toHaveBeenCalled()
  })

  it("chama revalidatePath após reordenar", async () => {
    mockDb.$transaction.mockResolvedValue([])

    await reorderEnvelopes(["id-1"])

    expect(revalidatePath).toHaveBeenCalledWith("/")
  })
})
