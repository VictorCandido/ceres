import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DeleteExpenseButton } from "@/components/delete-expense-button"

vi.mock("@/server/expenses/actions", () => ({
  deleteExpense: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { deleteExpense } from "@/server/expenses/actions"
import { toast } from "sonner"

const mockDelete = deleteExpense as ReturnType<typeof vi.fn>
const mockToast = toast as { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> }

beforeEach(() => {
  vi.clearAllMocks()
  // global.confirm is set to vi.fn() in vitest.setup.ts
  ;(global.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true)
})

describe("DeleteExpenseButton", () => {
  it("renderiza botão de excluir", () => {
    render(<DeleteExpenseButton expenseId="exp-001" />)
    expect(screen.getByRole("button", { name: /excluir lançamento/i })).toBeInTheDocument()
  })

  it("abre confirmação ao clicar", async () => {
    const user = userEvent.setup()
    mockDelete.mockResolvedValue({ ok: true, data: undefined })
    render(<DeleteExpenseButton expenseId="exp-001" />)

    await user.click(screen.getByRole("button", { name: /excluir lançamento/i }))

    expect(global.confirm).toHaveBeenCalledWith("Excluir este lançamento?")
  })

  it("chama deleteExpense quando usuário confirma", async () => {
    const user = userEvent.setup()
    mockDelete.mockResolvedValue({ ok: true, data: undefined })
    render(<DeleteExpenseButton expenseId="exp-001" />)

    await user.click(screen.getByRole("button", { name: /excluir lançamento/i }))

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("exp-001")
    })
  })

  it("não chama deleteExpense quando usuário cancela", async () => {
    const user = userEvent.setup()
    ;(global.confirm as ReturnType<typeof vi.fn>).mockReturnValue(false)
    render(<DeleteExpenseButton expenseId="exp-001" />)

    await user.click(screen.getByRole("button", { name: /excluir lançamento/i }))

    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("mostra toast de sucesso após excluir", async () => {
    const user = userEvent.setup()
    mockDelete.mockResolvedValue({ ok: true, data: undefined })
    render(<DeleteExpenseButton expenseId="exp-001" />)

    await user.click(screen.getByRole("button", { name: /excluir lançamento/i }))

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Lançamento excluído.")
    })
  })

  it("mostra toast de erro quando deleteExpense falha", async () => {
    const user = userEvent.setup()
    mockDelete.mockResolvedValue({ ok: false, error: "Erro interno" })
    render(<DeleteExpenseButton expenseId="exp-001" />)

    await user.click(screen.getByRole("button", { name: /excluir lançamento/i }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Erro ao excluir lançamento.")
    })
  })
})
