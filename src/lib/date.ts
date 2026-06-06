import { format, addMonths, parseISO } from "date-fns"
import { toZonedTime } from "date-fns-tz"

const TZ = "America/Sao_Paulo"

export const currentReferenceMonth = (): string =>
  format(toZonedTime(new Date(), TZ), "yyyy-MM")

export const referenceMonthFromDate = (date: Date): string =>
  format(toZonedTime(date, TZ), "yyyy-MM")

export const prevMonth = (month: string): string =>
  format(addMonths(parseISO(`${month}-01`), -1), "yyyy-MM")

export const nextMonth = (month: string): string =>
  format(addMonths(parseISO(`${month}-01`), 1), "yyyy-MM")

export const formatMonthLabel = (month: string): string =>
  format(parseISO(`${month}-01`), "MMMM 'de' yyyy", {
    locale: undefined,
  }).replace(/^\w/, (c) => c.toUpperCase())

export const formatMonthLabelShort = (month: string): string => {
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ]
  const [year, month2] = month.split("-")
  return `${months[parseInt(month2) - 1]} ${year}`
}

export const formatDateBR = (date: Date): string =>
  format(toZonedTime(date, TZ), "dd/MM/yyyy")
