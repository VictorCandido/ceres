import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { BalanceBadge } from "@/components/balance-badge"

describe("BalanceBadge", () => {
  it("renderiza saldo positivo com valor formatado", () => {
    render(<BalanceBadge balance={5000} />)

    expect(screen.getByText(/50,00/)).toBeInTheDocument()
  })

  it("renderiza saldo negativo com valor formatado", () => {
    render(<BalanceBadge balance={-20000} />)

    expect(screen.getByText(/200,00/)).toBeInTheDocument()
  })

  it("renderiza saldo zero", () => {
    render(<BalanceBadge balance={0} />)

    expect(screen.getByText(/0,00/)).toBeInTheDocument()
  })

  it("aplica cor verde para saldo positivo", () => {
    const { container } = render(<BalanceBadge balance={10000} />)

    const span = container.querySelector("span")
    expect(span?.className).toContain("emerald")
  })

  it("aplica cor vermelha (destructive) para saldo negativo", () => {
    const { container } = render(<BalanceBadge balance={-1} />)

    const span = container?.querySelector("span")
    expect(span?.className).toContain("destructive")
  })

  it("aplica cor verde para saldo zero (não está negativo)", () => {
    const { container } = render(<BalanceBadge balance={0} />)

    const span = container.querySelector("span")
    expect(span?.className).not.toContain("destructive")
  })

  it("aceita className adicional", () => {
    const { container } = render(<BalanceBadge balance={1000} className="text-xl" />)

    const span = container.querySelector("span")
    expect(span?.className).toContain("text-xl")
  })
})
