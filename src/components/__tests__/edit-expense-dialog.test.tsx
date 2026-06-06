import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditExpenseDialog } from "@/components/edit-expense-dialog"

vi.mock("@/server/expenses/actions", () => ({
  updateExpense: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { updateExpense } from "@/server/expenses/actions"
import { toast } from "sonner"

const mockUpdate = updateExpense as ReturnType<typeof vi.fn>
const mockToast = toast as { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> }

const ENVELOPES = [
  { id: "550e8400-e29b-41d4-a716-446655440001", name: "Alimentação", color: "#22c55e" },
  { id: "550e8400-e29b-41d4-a716-446655440002", name: "Transporte", color: "#3b82f6" },
]

const EXPENSE = {
  id: "exp-001",
  envelopeId: "550e8400-e29b-41d4-a716-446655440001",
  amountCents: 8990,
  description: "Almoço",
  occurredAt: new Date("2026-06-05T12:00:00Z"),
  referenceMonth: "2026-06",
  createdAt: new Date("2026-06-05T12:00:00Z"),
  envelope: { id: "550e8400-e29b-41d4-a716-446655440001", name: "Alimentação", color: "#22c55e" },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("EditExpenseDialog", () => {
  it("renderiza botão de editar", () => {
    render(<EditExpenseDialog expense={EXPENSE} envelopes={ENVELOPES} />)
    expect(screen.getByRole("button", { name: /editar lançamento/i })).toBeInTheDocument()
  })

  it("abre o dialog ao clicar no botão de editar", async () => {
    const user = userEvent.setup()
    render(<EditExpenseDialog expense={EXPENSE} envelopes={ENVELOPES} />)

    await user.click(screen.getByRole("button", { name: /editar lançamento/i }))

    expect(screen.getByText("Editar lançamento")).toBeInTheDocument()
  })

  it("preenche o campo valor com o valor atual do lançamento", async () => {
    const user = userEvent.setup()
    render(<EditExpenseDialog expense={EXPENSE} envelopes={ENVELOPES} />)

    await user.click(screen.getByRole("button", { name: /editar lançamento/i }))

    const valorInput = screen.getByLabelText(/valor/i) as HTMLInputElement
    expect(valorInput.value).toBe("89,90")
  })

  it("preenche o campo descrição com a descrição atual", async () => {
    const user = userEvent.setup()
    render(<EditExpenseDialog expense={EXPENSE} envelopes={ENVELOPES} />)

    await user.click(screen.getByRole("button", { name: /editar lançamento/i }))

    const descInput = screen.getByLabelText(/descrição/i) as HTMLTextAreaElement
    expect(descInput.value).toBe("Almoço")
  })

  it("preenche o campo data com a data atual do lançamento", async () => {
    const user = userEvent.setup()
    render(<EditExpenseDialog expense={EXPENSE} envelopes={ENVELOPES} />)

    await user.click(screen.getByRole("button", { name: /editar lançamento/i }))

    const dateInput = screen.getByLabelText(/data/i) as HTMLInputElement
    expect(dateInput.value).toBe("2026-06-05")
  })

  it("fecha dialog ao clicar em Cancelar", async () => {
    const user = userEvent.setup()
    render(<EditExpenseDialog expense={EXPENSE} envelopes={ENVELOPES} />)

    await user.click(screen.getByRole("button", { name: /editar lançamento/i }))
    expect(screen.getByText("Editar lançamento")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /cancelar/i }))

    await waitFor(() => {
      expect(screen.queryByText("Editar lançamento")).not.toBeInTheDocument()
    })
  })

  it("chama updateExpense ao submeter e fecha o dialog em caso de sucesso", async () => {
    const user = userEvent.setup()
    mockUpdate.mockResolvedValue({ ok: true, data: undefined })
    render(<EditExpenseDialog expense={EXPENSE} envelopes={ENVELOPES} />)

    await user.click(screen.getByRole("button", { name: /editar lançamento/i }))

    const form = screen.getByLabelText(/valor/i).closest("form")!
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith("exp-001", expect.any(Object))
    })
  })

  it("mostra toast de sucesso após atualizar", async () => {
    const user = userEvent.setup()
    mockUpdate.mockResolvedValue({ ok: true, data: undefined })
    render(<EditExpenseDialog expense={EXPENSE} envelopes={ENVELOPES} />)

    await user.click(screen.getByRole("button", { name: /editar lançamento/i }))

    const form = screen.getByLabelText(/valor/i).closest("form")!
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Lançamento atualizado!")
    })
  })

  it("mostra toast de erro quando updateExpense falha", async () => {
    const user = userEvent.setup()
    mockUpdate.mockResolvedValue({ ok: false, error: "Valor inválido" })
    render(<EditExpenseDialog expense={EXPENSE} envelopes={ENVELOPES} />)

    await user.click(screen.getByRole("button", { name: /editar lançamento/i }))

    const form = screen.getByLabelText(/valor/i).closest("form")!
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Valor inválido")
    })
  })
})
