import { describe, it, expect } from "vitest"
import { formatBRL, parseCents, centsToBRL } from "@/lib/money"

describe("formatBRL", () => {
  it("formata zero corretamente", () => {
    expect(formatBRL(0)).toBe("R$ 0,00")
  })

  it("formata centavos inteiros (ex: R$ 10,00)", () => {
    expect(formatBRL(1000)).toBe("R$ 10,00")
  })

  it("formata valores com centavos (ex: R$ 10,50)", () => {
    expect(formatBRL(1050)).toBe("R$ 10,50")
  })

  it("formata valores grandes (ex: R$ 1.500,00)", () => {
    expect(formatBRL(150000)).toBe("R$ 1.500,00")
  })

  it("formata valores negativos (saldo no vermelho)", () => {
    const result = formatBRL(-5000)
    expect(result).toContain("50,00")
    expect(result).toContain("-")
  })

  it("formata 1 centavo", () => {
    expect(formatBRL(1)).toBe("R$ 0,01")
  })
})

describe("parseCents", () => {
  it("parseia inteiro simples", () => {
    expect(parseCents("10")).toBe(1000)
  })

  it("parseia valor com vírgula como decimal (pt-BR)", () => {
    expect(parseCents("10,50")).toBe(1050)
  })

  it("parseia valor com ponto como decimal", () => {
    expect(parseCents("10.50")).toBe(1050)
  })

  it("parseia zero", () => {
    expect(parseCents("0")).toBe(0)
  })

  it("parseia valor com espaços", () => {
    expect(parseCents(" 15 ")).toBe(1500)
  })

  it("retorna 0 para string inválida", () => {
    expect(parseCents("abc")).toBe(0)
  })

  it("parseia valor grande", () => {
    expect(parseCents("1500,00")).toBe(150000)
  })

  it("arredonda corretamente para evitar erros de float", () => {
    // 0.1 + 0.2 = 0.30000000000000004 em float
    expect(parseCents("0,30")).toBe(30)
  })
})

describe("centsToBRL", () => {
  it("converte 100 centavos para 1.0", () => {
    expect(centsToBRL(100)).toBe(1.0)
  })

  it("converte 1050 centavos para 10.5", () => {
    expect(centsToBRL(1050)).toBe(10.5)
  })

  it("converte 0 para 0", () => {
    expect(centsToBRL(0)).toBe(0)
  })

  it("converte negativos corretamente", () => {
    expect(centsToBRL(-500)).toBe(-5.0)
  })
})
