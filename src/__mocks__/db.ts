import { vi } from "vitest"

export const db = {
  envelope: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    aggregate: vi.fn(),
  },
  envelopeLimit: {
    upsert: vi.fn(),
  },
  expense: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(),
  $disconnect: vi.fn(),
}
