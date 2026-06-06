import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MonthNav } from "@/components/month-nav"

describe("MonthNav", () => {
  it("renderiza o mês atual formatado", () => {
    render(<MonthNav month="2024-06" />)

    expect(screen.getByText("Jun 2024")).toBeInTheDocument()
  })

  it("renderiza botão de mês anterior", () => {
    render(<MonthNav month="2024-06" />)

    const prevBtn = screen.getByRole("button", { name: /mês anterior/i })
    expect(prevBtn).toBeInTheDocument()
    expect(prevBtn).toHaveAttribute("href", "/2024-05")
  })

  it("renderiza botão de próximo mês", () => {
    render(<MonthNav month="2024-06" />)

    const nextBtn = screen.getByRole("button", { name: /próximo mês/i })
    expect(nextBtn).toBeInTheDocument()
    expect(nextBtn).toHaveAttribute("href", "/2024-07")
  })

  it("navega corretamente de dezembro para janeiro", () => {
    render(<MonthNav month="2024-12" />)

    const nextBtn = screen.getByRole("button", { name: /próximo mês/i })
    expect(nextBtn).toHaveAttribute("href", "/2025-01")
  })

  it("navega corretamente de janeiro para dezembro do ano anterior", () => {
    render(<MonthNav month="2024-01" />)

    const prevBtn = screen.getByRole("button", { name: /mês anterior/i })
    expect(prevBtn).toHaveAttribute("href", "/2023-12")
  })

  it("exibe 'Jan 2024' para 2024-01", () => {
    render(<MonthNav month="2024-01" />)

    expect(screen.getByText("Jan 2024")).toBeInTheDocument()
  })

  it("exibe 'Dez 2023' para 2023-12", () => {
    render(<MonthNav month="2023-12" />)

    expect(screen.getByText("Dez 2023")).toBeInTheDocument()
  })

  it("inclui basePath nos links quando fornecido", () => {
    render(<MonthNav month="2024-06" basePath="expenses" />)

    expect(screen.getByRole("button", { name: /mês anterior/i })).toHaveAttribute("href", "/2024-05/expenses")
    expect(screen.getByRole("button", { name: /próximo mês/i })).toHaveAttribute("href", "/2024-07/expenses")
  })
})
