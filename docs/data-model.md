# Modelo de dados — Ceres

Schema do Postgres, modelado via Prisma. Termos refletem o glossário em [domain.md](domain.md).

## Visão geral

```
                ┌──────────────────┐
        ┌─ 1:N ─│  EnvelopeLimit   │
        │       │ (limite/vigência)│
        │       └──────────────────┘
┌──────────────┐
│   Envelope   │
│  (Caixinha)  │
└──────────────┘
        │       ┌──────────────┐
        └─ 1:N ─│   Expense    │
                │ (Lançamento) │
                └──────────────┘
```

Três tabelas na v1: `Envelope`, `EnvelopeLimit`, `Expense`. O saldo é **sempre derivado** (calculado em tempo de query), nunca armazenado — evita inconsistência ao editar/excluir.

## Schema Prisma (rascunho)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Envelope {
  id           String   @id @default(uuid()) @db.Uuid
  name         String
  archived     Boolean  @default(false)
  displayOrder Int      @default(0)
  color        String?  // hex ou token do design system
  icon         String?  // nome de ícone (lucide)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  limits   EnvelopeLimit[]
  expenses Expense[]

  @@index([archived, displayOrder])
}

model EnvelopeLimit {
  id                 String @id @default(uuid()) @db.Uuid
  envelopeId         String @db.Uuid
  limitCents         Int
  effectiveFromMonth String // formato YYYY-MM, ex: "2026-06"

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  envelope Envelope @relation(fields: [envelopeId], references: [id], onDelete: Cascade)

  @@unique([envelopeId, effectiveFromMonth])
  @@index([envelopeId, effectiveFromMonth])
}

model Expense {
  id             String   @id @default(uuid()) @db.Uuid
  envelopeId     String   @db.Uuid
  amountCents    Int
  description    String?
  occurredAt     DateTime
  referenceMonth String   // formato YYYY-MM, ex: "2026-06"

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  envelope Envelope @relation(fields: [envelopeId], references: [id], onDelete: Restrict)

  @@index([envelopeId, referenceMonth])
  @@index([referenceMonth])
}
```

## Decisões de modelagem

### Por que `amountCents: Int` e não `Decimal`?

- Operações em centavos são exatas em inteiros — `Decimal` adiciona complexidade sem ganho pro caso.
- Int 32-bit comporta até ~R$ 21 milhões, mais que suficiente.
- Padrão consagrado (Stripe usa).

### Por que `referenceMonth: String "YYYY-MM"`?

- Comparações com `=`, `<`, `>`, `IN` funcionam lexicograficamente nesse formato.
- Index simples.
- Mais legível em logs e debugging que `(year, month)` em duas colunas.
- Alternativa considerada: `DATE` apontando pro dia 1 do mês. Funciona, mas mistura "data real" com "marcador de mês" e abre brecha pra bug.

### Por que `onDelete: Restrict` no `Envelope` (vindo de `Expense`) e `Cascade` em `EnvelopeLimit`?

Excluir uma caixinha com lançamentos quebraria histórico — por isso `Expense.envelope` é `Restrict`. A operação correta é **arquivar** (`archived = true`).

Já `EnvelopeLimit` é `Cascade`: se em algum caso de borda (limpeza de teste, etc) uma caixinha for excluída, os limites associados não fazem sentido sozinhos e vão junto.

### Por que `EnvelopeLimit` separado em vez de `monthlyLimitCents` no `Envelope`?

Pra preservar histórico. Se o limite estiver no `Envelope`, alterar o valor em junho muda retroativamente o saldo de janeiro — informação histórica perdida. Com `EnvelopeLimit (effectiveFromMonth, limitCents)`, cada mês passado mantém o limite que estava vigente naquele momento.

Query do limite vigente num mês `M`:

```sql
SELECT limit_cents
FROM envelope_limits
WHERE envelope_id = $1
  AND effective_from_month <= $2
ORDER BY effective_from_month DESC
LIMIT 1;
```

Indexado por `(envelopeId, effectiveFromMonth)` — query é trivial.

### Por que saldo não é armazenado?

Editar/excluir lançamento exigiria recalcular e atualizar em cascata. Como o volume de dados é pequeno (uso pessoal, talvez ~200 lançamentos/mês), calcular sob demanda é trivial:

```sql
SELECT envelope_id, SUM(amount_cents) AS total
FROM expenses
WHERE reference_month = '2026-06'
GROUP BY envelope_id;
```

Se virar gargalo no futuro, materializar numa view ou cache.

## Migrations futuras antecipadas

Não implementar agora, mas o schema deve permitir evoluir sem dor pra:

- **Recorrentes**: nova tabela `RecurringExpense (envelopeId, amountCents, description, dayOfMonth, startsAt, endsAt?)` + job que gera `Expense`.
- **Cartões/contas**: nova tabela `PaymentMethod`; FK opcional em `Expense`.

## Seed para desenvolvimento

Quando o seed for criado, popular com caixinhas de exemplo coerentes com o caso de uso real. Cada caixinha cria um `EnvelopeLimit` inicial com `effectiveFromMonth = mês atual`:

- Supermercado — R$ 1.500
- Gasolina — R$ 400
- Lazer — R$ 600
- Manutenção — R$ 200
- Outros — R$ 300
