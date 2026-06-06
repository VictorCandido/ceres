import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CURRENT_MONTH = new Date().toISOString().slice(0, 7)

const ENVELOPES: Array<{
  name: string
  color: string
  displayOrder: number
  limitCents: number
}> = [
  { name: "Alimentação", color: "#22c55e", displayOrder: 0, limitCents: 150000 },
  { name: "Transporte", color: "#3b82f6", displayOrder: 1, limitCents: 40000 },
  { name: "Saúde", color: "#ec4899", displayOrder: 2, limitCents: 30000 },
  { name: "Lazer", color: "#f59e0b", displayOrder: 3, limitCents: 50000 },
  { name: "Casa", color: "#8b5cf6", displayOrder: 4, limitCents: 80000 },
  { name: "Roupas", color: "#06b6d4", displayOrder: 5, limitCents: 20000 },
  { name: "Outros", color: "#6b7280", displayOrder: 6, limitCents: 15000 },
]

async function main() {
  console.log("Seeding database...")
  for (const e of ENVELOPES) {
    const envelope = await prisma.envelope.create({
      data: {
        name: e.name,
        color: e.color,
        displayOrder: e.displayOrder,
        limits: { create: { limitCents: e.limitCents, effectiveFromMonth: CURRENT_MONTH } },
      },
    })
    console.log(`  Created: ${envelope.name}`)
  }
  console.log("Done.")
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
