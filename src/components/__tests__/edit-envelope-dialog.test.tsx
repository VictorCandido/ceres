import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditEnvelopeDialog } from "@/components/edit-envelope-dialog"

vi.mock("@/server/envelopes/actions", () => ({
  updateEnvelope: vi.fn(),
  updateEnvelopeLimit: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("@/lib/date", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/date")>()
  return { ...actual, currentReferenceMonth: vi.fn(() => "2024-06") }
})

import { updateEnvelope, updateEnvelopeLimit } from "@/server/envelopes/actions"
import { toast } from "sonner"

const mockUpdateEnvelope = updateEnvelope as ReturnType<typeof vi.fn>
const mockUpdateLimit = updateEnvelopeLimit as ReturnType<typeof vi.fn>
const mockToast = toast as { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> }

const ENVELOPE = {
  id: "env-1",
  name: "Alimentação",
  color: "#22c55e",
  currentLimit: 150000,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("EditEnvelopeDialog", () => {
  it("renderiza botão de editar (lápis)", () => {
    render(<EditEnvelopeDialog envelope={ENVELOPE} />)

    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("abre o dialog ao clicar no botão de editar", async () => {
    const user = userEvent.setup()
    render(<EditEnvelopeDialog envelope={ENVELOPE} />)

    await user.click(screen.getByRole("button"))

    expect(screen.getByRole("heading", { name: "Editar caixinha" })).toBeInTheDocument()
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/limite mensal/i)).toBeInTheDocument()
  })

  it("preenche o nome do envelope como valor inicial", async () => {
    const user = userEvent.setup()
    render(<EditEnvelopeDialog envelope={ENVELOPE} />)

    await user.click(screen.getByRole("button"))

    const nameInput = screen.getByLabelText(/nome/i) as HTMLInputElement
    expect(nameInput.value).toBe("Alimentação")
  })

  it("preenche o limite como valor inicial formatado", async () => {
    const user = userEvent.setup()
    render(<EditEnvelopeDialog envelope={ENVELOPE} />)

    await user.click(screen.getByRole("button"))

    const limitInput = screen.getByLabelText(/limite mensal/i) as HTMLInputElement
    expect(limitInput.value).toMatch(/1500/)
  })

  it("renderiza seletor de cores com 8 opções", async () => {
    const user = userEvent.setup()
    render(<EditEnvelopeDialog envelope={ENVELOPE} />)

    await user.click(screen.getByRole("button"))

    const colorButtons = screen.getAllByRole("button").filter(
      (btn) => btn.getAttribute("aria-label")?.startsWith("#")
    )
    expect(colorButtons).toHaveLength(8)
  })

  it("fecha dialog ao clicar em Cancelar", async () => {
    const user = userEvent.setup()
    render(<EditEnvelopeDialog envelope={ENVELOPE} />)

    await user.click(screen.getByRole("button"))
    expect(screen.getByRole("heading", { name: "Editar caixinha" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /cancelar/i }))

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Editar caixinha" })).not.toBeInTheDocument()
    })
  })

  it("chama updateEnvelope e updateEnvelopeLimit ao submeter", async () => {
    const user = userEvent.setup()
    mockUpdateEnvelope.mockResolvedValue({ ok: true, data: undefined })
    mockUpdateLimit.mockResolvedValue({ ok: true, data: undefined })
    render(<EditEnvelopeDialog envelope={ENVELOPE} />)

    await user.click(screen.getByRole("button"))
    await user.clear(screen.getByLabelText(/nome/i))
    await user.type(screen.getByLabelText(/nome/i), "Novo Nome")
    await user.click(screen.getByRole("button", { name: /salvar/i }))

    await waitFor(() => {
      expect(mockUpdateEnvelope).toHaveBeenCalledWith(
        "env-1",
        expect.objectContaining({ name: "Novo Nome" })
      )
      expect(mockUpdateLimit).toHaveBeenCalledWith("env-1", expect.any(Number), "2024-06")
    })
  })

  it("mostra toast de sucesso após salvar", async () => {
    const user = userEvent.setup()
    mockUpdateEnvelope.mockResolvedValue({ ok: true, data: undefined })
    mockUpdateLimit.mockResolvedValue({ ok: true, data: undefined })
    render(<EditEnvelopeDialog envelope={ENVELOPE} />)

    await user.click(screen.getByRole("button"))
    await user.click(screen.getByRole("button", { name: /salvar/i }))

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Caixinha atualizada!")
    })
  })

  it("fecha dialog após atualização bem-sucedida", async () => {
    const user = userEvent.setup()
    mockUpdateEnvelope.mockResolvedValue({ ok: true, data: undefined })
    mockUpdateLimit.mockResolvedValue({ ok: true, data: undefined })
    render(<EditEnvelopeDialog envelope={ENVELOPE} />)

    await user.click(screen.getByRole("button"))
    await user.click(screen.getByRole("button", { name: /salvar/i }))

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Editar caixinha" })).not.toBeInTheDocument()
    })
  })

  it("mostra toast de erro quando updateEnvelope falha", async () => {
    const user = userEvent.setup()
    mockUpdateEnvelope.mockResolvedValue({ ok: false, error: "Nome inválido" })
    mockUpdateLimit.mockResolvedValue({ ok: true, data: undefined })
    render(<EditEnvelopeDialog envelope={ENVELOPE} />)

    await user.click(screen.getByRole("button"))
    await user.click(screen.getByRole("button", { name: /salvar/i }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Nome inválido")
    })
  })

  it("mostra toast de erro quando updateEnvelopeLimit falha", async () => {
    const user = userEvent.setup()
    mockUpdateEnvelope.mockResolvedValue({ ok: true, data: undefined })
    mockUpdateLimit.mockResolvedValue({ ok: false, error: "Limite inválido" })
    render(<EditEnvelopeDialog envelope={ENVELOPE} />)

    await user.click(screen.getByRole("button"))
    await user.click(screen.getByRole("button", { name: /salvar/i }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Limite inválido")
    })
  })

  it("usa fallback de cor quando envelope.color é null", () => {
    render(<EditEnvelopeDialog envelope={{ ...ENVELOPE, color: null }} />)
    // Não deve lançar erro
    expect(screen.getByRole("button")).toBeInTheDocument()
  })
})
