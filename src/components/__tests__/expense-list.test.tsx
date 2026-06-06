import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ExpenseList } from "@/components/expense-list"

vi.mock("@/server/expenses/actions", () => ({
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const ENVELOPES = [
  { id: "env-001", name: "Alimentação", color: "#22c55e" },
  { id: "env-002", name: "Transporte", color: "#3b82f6" },
]

const EXPENSES = [
  {
    id: "exp-001",
    envelopeId: "env-001",
    amountCents: 8990,
    description: "Mercado",
    occurredAt: new Date("2026-06-03T12:00:00Z"),
    referenceMonth: "2026-06",
    createdAt: new Date("2026-06-03T12:00:00Z"),
    envelope: { id: "env-001", name: "Alimentação", color: "#22c55e" },
  },
  {
    id: "exp-002",
    envelopeId: "env-002",
    amountCents: 4500,
    description: "Uber",
    occurredAt: new Date("2026-06-04T12:00:00Z"),
    referenceMonth: "2026-06",
    createdAt: new Date("2026-06-04T12:00:00Z"),
    envelope: { id: "env-002", name: "Transporte", color: "#3b82f6" },
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ExpenseList", () => {
  it("renderiza todos os lançamentos sem filtro", () => {
    render(<ExpenseList expenses={EXPENSES} envelopes={ENVELOPES} />)

    expect(screen.getByText("Mercado")).toBeInTheDocument()
    expect(screen.getByText("Uber")).toBeInTheDocument()
  })

  it("mostra contagem correta de lançamentos", () => {
    render(<ExpenseList expenses={EXPENSES} envelopes={ENVELOPES} />)

    expect(screen.getByText("2 lançamentos")).toBeInTheDocument()
  })

  it("mostra singular para 1 lançamento", () => {
    render(<ExpenseList expenses={[EXPENSES[0]]} envelopes={ENVELOPES} />)

    expect(screen.getByText("1 lançamento")).toBeInTheDocument()
  })

  it("mostra valores formatados em BRL", () => {
    render(<ExpenseList expenses={EXPENSES} envelopes={ENVELOPES} />)

    expect(screen.getByText(/89,90/)).toBeInTheDocument()
    expect(screen.getByText(/45,00/)).toBeInTheDocument()
  })

  it("exibe mensagem quando lista está vazia", () => {
    render(<ExpenseList expenses={[]} envelopes={ENVELOPES} />)

    expect(screen.getByText("Nenhum lançamento neste mês.")).toBeInTheDocument()
  })

  it("filtra lançamentos por caixinha ao selecionar no filtro", async () => {
    const user = userEvent.setup()
    render(<ExpenseList expenses={EXPENSES} envelopes={ENVELOPES} />)

    const selectTrigger = document.querySelector('[data-slot="select-trigger"]') as HTMLElement
    expect(selectTrigger).toBeInTheDocument()
    await user.click(selectTrigger)

    await waitFor(() => {
      const options = screen.getAllByRole("option")
      expect(options.length).toBeGreaterThan(0)
    })

    const alimentacaoOption = screen.getAllByRole("option").find(
      (opt) => opt.textContent?.includes("Alimentação")
    )
    expect(alimentacaoOption).toBeDefined()
    await user.click(alimentacaoOption!)

    await waitFor(() => {
      expect(screen.getByText("Mercado")).toBeInTheDocument()
      expect(screen.queryByText("Uber")).not.toBeInTheDocument()
    })
  })

  it("renderiza botões de editar e excluir para cada lançamento", () => {
    render(<ExpenseList expenses={EXPENSES} envelopes={ENVELOPES} />)

    const editBtns = screen.getAllByRole("button", { name: /editar lançamento/i })
    const deleteBtns = screen.getAllByRole("button", { name: /excluir lançamento/i })

    expect(editBtns).toHaveLength(2)
    expect(deleteBtns).toHaveLength(2)
  })

  it("exibe o nome da caixinha quando lançamento não tem descrição", () => {
    const expenseWithoutDescription = {
      ...EXPENSES[0],
      description: null,
      id: "exp-003",
    }
    render(<ExpenseList expenses={[expenseWithoutDescription]} envelopes={ENVELOPES} />)

    expect(screen.getByText("Alimentação")).toBeInTheDocument()
  })

  it("volta para todas as caixinhas ao selecionar 'Todas'", async () => {
    const user = userEvent.setup()
    render(<ExpenseList expenses={EXPENSES} envelopes={ENVELOPES} />)

    const selectTrigger = document.querySelector('[data-slot="select-trigger"]') as HTMLElement

    // Filtra por Alimentação
    await user.click(selectTrigger)
    await waitFor(() => {
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0)
    })
    const alimentacaoOption = screen.getAllByRole("option").find(
      (opt) => opt.textContent?.includes("Alimentação")
    )!
    await user.click(alimentacaoOption)

    await waitFor(() => {
      expect(screen.queryByText("Uber")).not.toBeInTheDocument()
    })

    // Volta para todas
    await user.click(selectTrigger)
    await waitFor(() => {
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0)
    })
    const todasOption = screen.getAllByRole("option").find(
      (opt) => opt.textContent?.includes("Todas as caixinhas")
    )!
    await user.click(todasOption)

    await waitFor(() => {
      expect(screen.getByText("Uber")).toBeInTheDocument()
    })
  })
})
