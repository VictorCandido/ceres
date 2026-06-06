export const formatBRL = (cents: number): string =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export const parseCents = (input: string): number => {
  const normalized = input.replace(/\s/g, "").replace(",", ".")
  const value = parseFloat(normalized)
  if (isNaN(value)) return 0
  return Math.round(value * 100)
}

export const centsToBRL = (cents: number): number => cents / 100
