import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CreateEnvelopeDialog } from "@/components/create-envelope-dialog"

vi.mock("@/server/envelopes/actions", () => ({
  createEnvelope: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { createEnvelope } from "@/server/envelopes/actions"
import { toast } from "sonner"

const mockCreate = createEnvelope as ReturnType<typeof vi.fn>
const mockToast = toast as { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> }

beforeEach(() => {
  vi.clearAllMocks()
})

describe("CreateEnvelopeDialog", () => {
  it("renderiza botão 'Nova caixinha'", () => {
    render(<CreateEnvelopeDialog />)

    expect(screen.getByRole("button", { name: /nova caixinha/i })).toBeInTheDocument()
  })

  it("abre o dialog ao clicar no botão", async () => {
    const user = userEvent.setup()
    render(<CreateEnvelopeDialog />)

    await user.click(screen.getByRole("button", { name: /nova caixinha/i }))

    expect(screen.getByRole("heading", { name: "Nova caixinha" })).toBeInTheDocument()
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/limite mensal/i)).toBeInTheDocument()
  })

  it("renderiza seletor de cores com 8 opções", async () => {
    const user = userEvent.setup()
    render(<CreateEnvelopeDialog />)

    await user.click(screen.getByRole("button", { name: /nova caixinha/i }))

    const colorButtons = screen.getAllByRole("button").filter(
      (btn) => btn.getAttribute("aria-label")?.startsWith("#")
    )
    expect(colorButtons).toHaveLength(8)
  })

  it("fecha dialog ao clicar em Cancelar", async () => {
    const user = userEvent.setup()
    render(<CreateEnvelopeDialog />)

    await user.click(screen.getByRole("button", { name: /nova caixinha/i }))
    expect(screen.getByRole("heading", { name: "Nova caixinha" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /cancelar/i }))

    await waitFor(() => {
      expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument()
    })
  })

  it("chama createEnvelope com nome e limite ao submeter", async () => {
    const user = userEvent.setup()
    mockCreate.mockResolvedValue({ ok: true, data: { id: "new-env" } })
    render(<CreateEnvelopeDialog />)

    await user.click(screen.getByRole("button", { name: /nova caixinha/i }))
    await user.type(screen.getByLabelText(/nome/i), "Lazer")
    await user.type(screen.getByLabelText(/limite mensal/i), "300,00")
    await user.click(screen.getByRole("button", { name: /criar/i }))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Lazer",
          limitCents: 30000,
        })
      )
    })
  })

  it("mostra toast de sucesso após criar", async () => {
    const user = userEvent.setup()
    mockCreate.mockResolvedValue({ ok: true, data: { id: "new-env" } })
    render(<CreateEnvelopeDialog />)

    await user.click(screen.getByRole("button", { name: /nova caixinha/i }))
    await user.type(screen.getByLabelText(/nome/i), "Lazer")
    await user.type(screen.getByLabelText(/limite mensal/i), "300,00")
    await user.click(screen.getByRole("button", { name: /criar/i }))

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Caixinha criada!")
    })
  })

  it("fecha dialog após criação bem-sucedida", async () => {
    const user = userEvent.setup()
    mockCreate.mockResolvedValue({ ok: true, data: { id: "new-env" } })
    render(<CreateEnvelopeDialog />)

    await user.click(screen.getByRole("button", { name: /nova caixinha/i }))
    await user.type(screen.getByLabelText(/nome/i), "Lazer")
    await user.type(screen.getByLabelText(/limite mensal/i), "300,00")
    await user.click(screen.getByRole("button", { name: /criar/i }))

    await waitFor(() => {
      expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument()
    })
  })

  it("mostra toast de erro quando createEnvelope falha", async () => {
    const user = userEvent.setup()
    mockCreate.mockResolvedValue({ ok: false, error: "Nome obrigatório" })
    render(<CreateEnvelopeDialog />)

    await user.click(screen.getByRole("button", { name: /nova caixinha/i }))
    await user.type(screen.getByLabelText(/nome/i), "x")
    await user.type(screen.getByLabelText(/limite mensal/i), "100,00")
    await user.click(screen.getByRole("button", { name: /criar/i }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Nome obrigatório")
    })
  })
})
