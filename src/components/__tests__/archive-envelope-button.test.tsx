import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ArchiveEnvelopeButton } from "@/components/archive-envelope-button"

vi.mock("@/server/envelopes/actions", () => ({
  archiveEnvelope: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

import { archiveEnvelope } from "@/server/envelopes/actions"
import { toast } from "sonner"

const mockArchive = archiveEnvelope as ReturnType<typeof vi.fn>
const mockToast = toast as { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> }

beforeEach(() => {
  vi.clearAllMocks()
  mockPush.mockReset()
  vi.spyOn(window, "confirm").mockReturnValue(true)
})

describe("ArchiveEnvelopeButton", () => {
  it("renderiza botão de arquivar", () => {
    render(<ArchiveEnvelopeButton id="env-1" name="Alimentação" />)

    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("solicita confirmação ao clicar", async () => {
    const user = userEvent.setup()
    mockArchive.mockResolvedValue({ ok: true, data: undefined })
    render(<ArchiveEnvelopeButton id="env-1" name="Alimentação" />)

    await user.click(screen.getByRole("button"))

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("Alimentação")
    )
  })

  it("chama archiveEnvelope após confirmar", async () => {
    const user = userEvent.setup()
    mockArchive.mockResolvedValue({ ok: true, data: undefined })
    render(<ArchiveEnvelopeButton id="env-1" name="Alimentação" />)

    await user.click(screen.getByRole("button"))

    expect(mockArchive).toHaveBeenCalledWith("env-1")
  })

  it("mostra toast de sucesso após arquivar", async () => {
    const user = userEvent.setup()
    mockArchive.mockResolvedValue({ ok: true, data: undefined })
    render(<ArchiveEnvelopeButton id="env-1" name="Alimentação" />)

    await user.click(screen.getByRole("button"))

    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining("Alimentação"))
  })

  it("não chama archiveEnvelope quando o usuário cancela", async () => {
    const user = userEvent.setup()
    vi.spyOn(window, "confirm").mockReturnValue(false)
    render(<ArchiveEnvelopeButton id="env-1" name="Alimentação" />)

    await user.click(screen.getByRole("button"))

    expect(mockArchive).not.toHaveBeenCalled()
  })

  it("mostra toast de erro quando archiveEnvelope falha", async () => {
    const user = userEvent.setup()
    mockArchive.mockResolvedValue({ ok: false, error: "Erro ao arquivar" })
    render(<ArchiveEnvelopeButton id="env-1" name="Alimentação" />)

    await user.click(screen.getByRole("button"))

    expect(mockToast.error).toHaveBeenCalledWith("Erro ao arquivar")
  })

  it("redireciona para redirectTo após arquivar com sucesso", async () => {
    const user = userEvent.setup()
    mockArchive.mockResolvedValue({ ok: true, data: undefined })
    render(<ArchiveEnvelopeButton id="env-1" name="Alimentação" redirectTo="/2026-06" />)

    await user.click(screen.getByRole("button"))

    expect(mockPush).toHaveBeenCalledWith("/2026-06")
  })

  it("não redireciona quando redirectTo não é passado", async () => {
    const user = userEvent.setup()
    mockArchive.mockResolvedValue({ ok: true, data: undefined })
    render(<ArchiveEnvelopeButton id="env-1" name="Alimentação" />)

    await user.click(screen.getByRole("button"))

    expect(mockPush).not.toHaveBeenCalled()
  })

  it("não redireciona quando archiveEnvelope falha", async () => {
    const user = userEvent.setup()
    mockArchive.mockResolvedValue({ ok: false, error: "Erro" })
    render(<ArchiveEnvelopeButton id="env-1" name="Alimentação" redirectTo="/2026-06" />)

    await user.click(screen.getByRole("button"))

    expect(mockPush).not.toHaveBeenCalled()
  })

  it("inclui o nome da caixinha na mensagem de confirmação", async () => {
    const user = userEvent.setup()
    mockArchive.mockResolvedValue({ ok: true, data: undefined })
    render(<ArchiveEnvelopeButton id="env-2" name="Transporte" />)

    await user.click(screen.getByRole("button"))

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("Transporte")
    )
  })
})
