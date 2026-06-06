import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  currentReferenceMonth,
  referenceMonthFromDate,
  prevMonth,
  nextMonth,
  formatMonthLabel,
  formatMonthLabelShort,
  formatDateBR,
} from "@/lib/date"

describe("prevMonth", () => {
  it("retorna mês anterior normal", () => {
    expect(prevMonth("2024-06")).toBe("2024-05")
  })

  it("retroage do janeiro para dezembro do ano anterior", () => {
    expect(prevMonth("2024-01")).toBe("2023-12")
  })

  it("retroage corretamente em dezembro", () => {
    expect(prevMonth("2024-12")).toBe("2024-11")
  })
})

describe("nextMonth", () => {
  it("retorna próximo mês normal", () => {
    expect(nextMonth("2024-06")).toBe("2024-07")
  })

  it("avança de dezembro para janeiro do próximo ano", () => {
    expect(nextMonth("2024-12")).toBe("2025-01")
  })

  it("avança corretamente em janeiro", () => {
    expect(nextMonth("2024-01")).toBe("2024-02")
  })
})

describe("formatMonthLabel", () => {
  it("retorna string contendo o ano", () => {
    const result = formatMonthLabel("2024-06")
    expect(result).toMatch(/2024/)
  })

  it("capitaliza a primeira letra", () => {
    const result = formatMonthLabel("2024-03")
    expect(result.charAt(0)).toMatch(/[A-Z]/)
  })

  it("retorna string diferente para meses diferentes", () => {
    const jan = formatMonthLabel("2024-01")
    const jun = formatMonthLabel("2024-06")
    expect(jan).not.toBe(jun)
  })
})

describe("formatMonthLabelShort", () => {
  it("formata janeiro", () => {
    expect(formatMonthLabelShort("2024-01")).toBe("Jan 2024")
  })

  it("formata junho", () => {
    expect(formatMonthLabelShort("2024-06")).toBe("Jun 2024")
  })

  it("formata dezembro", () => {
    expect(formatMonthLabelShort("2024-12")).toBe("Dez 2024")
  })

  it("formata fevereiro", () => {
    expect(formatMonthLabelShort("2025-02")).toBe("Fev 2025")
  })

  it("formata todos os meses com abreviações corretas em PT-BR", () => {
    const expected = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    expected.forEach((abbr, i) => {
      const month = String(i + 1).padStart(2, "0")
      expect(formatMonthLabelShort(`2024-${month}`)).toContain(abbr)
    })
  })
})

describe("formatDateBR", () => {
  it("formata data no formato dd/MM/yyyy", () => {
    // Usa uma data UTC que, em São Paulo (UTC-3), resulta no mesmo dia
    const date = new Date("2024-06-15T12:00:00Z")
    expect(formatDateBR(date)).toBe("15/06/2024")
  })

  it("formata data com dia e mês de 1 dígito com zero à esquerda", () => {
    const date = new Date("2024-01-05T12:00:00Z")
    expect(formatDateBR(date)).toBe("05/01/2024")
  })
})

describe("referenceMonthFromDate", () => {
  it("extrai mês de referência de uma data no horário de SP", () => {
    const date = new Date("2024-06-15T15:00:00Z") // 12:00 em SP
    expect(referenceMonthFromDate(date)).toBe("2024-06")
  })

  it("extrai mês correto mesmo próximo à meia-noite (não muda de mês)", () => {
    // 23:30 BRT = 02:30 UTC do dia seguinte, mas ainda é o mesmo mês
    const date = new Date("2024-06-15T02:30:00Z")
    expect(referenceMonthFromDate(date)).toBe("2024-06")
  })
})

describe("currentReferenceMonth", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("retorna o mês atual no formato YYYY-MM", () => {
    vi.setSystemTime(new Date("2024-06-15T15:00:00Z"))
    const result = currentReferenceMonth()
    expect(result).toMatch(/^\d{4}-\d{2}$/)
    expect(result).toBe("2024-06")
  })

  it("retorna formato YYYY-MM para janeiro", () => {
    vi.setSystemTime(new Date("2024-01-10T15:00:00Z"))
    expect(currentReferenceMonth()).toBe("2024-01")
  })
})
