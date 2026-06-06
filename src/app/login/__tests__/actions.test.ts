import { describe, it, expect, vi, beforeEach } from "vitest"
import { login, logout } from "@/app/login/actions"

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "@/lib/auth"

const mockGetSession = getSession as ReturnType<typeof vi.fn>

function makeFormData(password: string) {
  const fd = new FormData()
  fd.append("password", password)
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CERES_PASSWORD = "senha-secreta-123"
})

describe("login", () => {
  it("autentica com senha correta e redireciona", async () => {
    const session = { authenticated: false, save: vi.fn() }
    mockGetSession.mockResolvedValue(session)

    await expect(login(makeFormData("senha-secreta-123"))).rejects.toThrow("NEXT_REDIRECT")

    expect(session.authenticated).toBe(true)
    expect(session.save).toHaveBeenCalled()
  })

  it("retorna erro para senha incorreta", async () => {
    const result = await login(makeFormData("senha-errada"))

    expect(result).toEqual({ error: "Senha incorreta" })
  })

  it("não salva sessão quando senha está errada", async () => {
    const session = { authenticated: false, save: vi.fn() }
    mockGetSession.mockResolvedValue(session)

    await login(makeFormData("errada"))

    expect(session.save).not.toHaveBeenCalled()
  })

  it("retorna erro para senha vazia", async () => {
    const result = await login(makeFormData(""))

    expect(result).toEqual({ error: "Senha incorreta" })
  })

  it("é case-sensitive (não aceita variações de maiúsculas)", async () => {
    process.env.CERES_PASSWORD = "MinhaSeNha"

    const result = await login(makeFormData("minhasenha"))

    expect(result).toEqual({ error: "Senha incorreta" })
  })
})

describe("logout", () => {
  it("destroi sessão e redireciona para /login", async () => {
    const session = { destroy: vi.fn() }
    mockGetSession.mockResolvedValue(session)

    await expect(logout()).rejects.toThrow("NEXT_REDIRECT")

    expect(session.destroy).toHaveBeenCalled()
  })
})
