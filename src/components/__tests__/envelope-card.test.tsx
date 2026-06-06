import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { EnvelopeCard } from "@/components/envelope-card"
import type { EnvelopeWithBalance } from "@/types"

function makeEnvelope(overrides: Partial<EnvelopeWithBalance> = {}): EnvelopeWithBalance {
  return {
    id: "env-1",
    name: "Alimentação",
    color: "#22c55e",
    icon: null,
    displayOrder: 0,
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    currentLimit: 150000,
    totalSpent: 80000,
    balance: 70000,
    ...overrides,
  }
}

const MONTH = "2026-06"

describe("EnvelopeCard", () => {
  it("renderiza nome do envelope", () => {
    render(<EnvelopeCard envelope={makeEnvelope({ name: "Transporte" })} month={MONTH} />)

    expect(screen.getByText("Transporte")).toBeInTheDocument()
  })

  it("renderiza saldo atual", () => {
    render(<EnvelopeCard envelope={makeEnvelope({ balance: 70000 })} month={MONTH} />)

    expect(screen.getByText(/700,00/)).toBeInTheDocument()
  })

  it("renderiza valor gasto", () => {
    render(<EnvelopeCard envelope={makeEnvelope({ totalSpent: 80000 })} month={MONTH} />)

    expect(screen.getByText(/Gasto/)).toBeInTheDocument()
    expect(screen.getByText(/800,00/)).toBeInTheDocument()
  })

  it("renderiza limite do envelope", () => {
    render(<EnvelopeCard envelope={makeEnvelope({ currentLimit: 150000 })} month={MONTH} />)

    expect(screen.getByText(/Limite/)).toBeInTheDocument()
    expect(screen.getByText(/1\.500,00/)).toBeInTheDocument()
  })

  it("mostra barra de progresso", () => {
    const { container } = render(<EnvelopeCard envelope={makeEnvelope()} month={MONTH} />)

    const progressBar = container.querySelector(".h-full.rounded-full")
    expect(progressBar).toBeInTheDocument()
  })

  it("barra de progresso em verde quando dentro do limite", () => {
    const { container } = render(
      <EnvelopeCard envelope={makeEnvelope({ balance: 10000, totalSpent: 90000, currentLimit: 100000 })} month={MONTH} />
    )

    const bar = container.querySelector(".h-full.rounded-full")
    expect(bar?.className).toContain("emerald")
    expect(bar?.className).not.toContain("destructive")
  })

  it("barra de progresso em vermelho quando estourado", () => {
    const { container } = render(
      <EnvelopeCard
        envelope={makeEnvelope({ balance: -20000, totalSpent: 120000, currentLimit: 100000 })}
        month={MONTH}
      />
    )

    const bar = container.querySelector(".h-full.rounded-full")
    expect(bar?.className).toContain("destructive")
  })

  it("barra de progresso não excede 100% visualmente", () => {
    const { container } = render(
      <EnvelopeCard
        envelope={makeEnvelope({ balance: -50000, totalSpent: 150000, currentLimit: 100000 })}
        month={MONTH}
      />
    )

    const bar = container.querySelector<HTMLElement>(".h-full.rounded-full")
    expect(bar?.style.width).toBe("100%")
  })

  it("renderiza barra em 0% quando não há gastos", () => {
    const { container } = render(
      <EnvelopeCard
        envelope={makeEnvelope({ totalSpent: 0, currentLimit: 100000, balance: 100000 })}
        month={MONTH}
      />
    )

    const bar = container.querySelector<HTMLElement>(".h-full.rounded-full")
    expect(bar?.style.width).toBe("0%")
  })

  it("usa cor do envelope no indicador visual", () => {
    const { container } = render(
      <EnvelopeCard envelope={makeEnvelope({ color: "#ff0000" })} month={MONTH} />
    )

    const colorDot = container.querySelector(".h-3.w-3.rounded-full") as HTMLElement | null
    expect(colorDot).toBeInTheDocument()
    expect(colorDot?.style.backgroundColor).toBeTruthy()
  })

  it("renderiza link para a página do envelope no mês correto", () => {
    const { container } = render(
      <EnvelopeCard envelope={makeEnvelope({ id: "env-42" })} month="2025-11" />
    )

    const link = container.querySelector("a")
    expect(link).toBeInTheDocument()
    expect(link?.getAttribute("href")).toBe("/2025-11/envelopes/env-42")
  })

  it("usa cor padrão quando envelope não tem cor", () => {
    const { container } = render(
      <EnvelopeCard envelope={makeEnvelope({ color: null as unknown as string })} month={MONTH} />
    )

    const colorDot = container.querySelector("[style*='background-color']")
    expect(colorDot).toBeInTheDocument()
  })
})
