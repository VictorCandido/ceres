import type {
  EnvelopeModel,
  EnvelopeLimitModel,
  ExpenseModel,
} from "@/generated/prisma/models"

export type Envelope = EnvelopeModel
export type EnvelopeLimit = EnvelopeLimitModel
export type Expense = ExpenseModel

export type EnvelopeWithBalance = Envelope & {
  currentLimit: number
  totalSpent: number
  balance: number
}

export type EnvelopeWithLimits = Envelope & {
  limits: EnvelopeLimit[]
}

export type ExpenseWithEnvelope = Expense & {
  envelope: Pick<Envelope, "id" | "name" | "color">
}

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }
