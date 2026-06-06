# Arquitetura técnica — Ceres

Stack, estrutura de pastas e convenções de código.

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js 15+ (App Router)** | Full-stack num projeto só. Server Components + Server Actions reduzem boilerplate de API REST. |
| Linguagem | **TypeScript (strict)** | Refatoração segura, autocomplete, especialmente importante em domínio financeiro. |
| Banco | **Postgres** (Neon) | SQL relacional, free tier confortável, branching grátis pra preview deploys. |
| ORM | **Prisma** | Migrations declarativas, client tipado, integra bem com Neon. |
| Estilo | **Tailwind CSS** | Velocidade de iteração. |
| Componentes | **shadcn/ui** | Componentes não-empacotados (copiamos pro projeto), Radix por baixo, acessível. |
| Validação | **Zod** | Validar inputs em Server Actions e bordas da API. |
| Auth | **TBD** — provavelmente NextAuth com GitHub OAuth, ou um único secret env (uso pessoal) | Sem necessidade de fluxo multi-usuário. |
| Datas | **date-fns** + **date-fns-tz** | Manipulação simples, suporte a timezones. |
| Deploy | **Vercel** | Zero config pra Next.js, preview deploys por branch, free tier suficiente. |

## Estrutura de pastas

```
ceres/
├── CLAUDE.md
├── README.md                    # criar depois, na primeira feature
├── docs/
│   ├── architecture.md          # este arquivo
│   ├── domain.md
│   ├── data-model.md
│   └── roadmap.md
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/                     # rotas (App Router)
│   │   ├── layout.tsx
│   │   ├── page.tsx             # dashboard do mês
│   │   ├── envelopes/
│   │   │   ├── page.tsx         # lista/gerencia caixinhas
│   │   │   └── [id]/page.tsx    # detalhe de uma caixinha
│   │   └── api/                 # só se precisar (Server Actions cobrem 95%)
│   ├── components/
│   │   ├── ui/                  # shadcn/ui (gerado)
│   │   └── ...                  # componentes do app
│   ├── lib/
│   │   ├── db.ts                # PrismaClient singleton
│   │   ├── money.ts             # formatar/parsear centavos ↔ R$
│   │   ├── date.ts              # helpers de mês/timezone
│   │   └── auth.ts
│   ├── server/                  # lógica de domínio (Server-only)
│   │   ├── envelopes/
│   │   │   ├── queries.ts       # ler do banco
│   │   │   └── actions.ts       # Server Actions (criar/editar/excluir)
│   │   └── expenses/
│   │       ├── queries.ts
│   │       └── actions.ts
│   └── types/
└── package.json
```

### Princípios da estrutura

- **`src/server/`**: toda lógica de domínio mora aqui. Queries leem (retornam DTOs prontos pra UI), actions escrevem (validam input com Zod, mutam, revalidam path). Componentes da `app/` chamam essas funções diretamente.
- **`src/lib/`**: utilitários puros, sem dependência de banco.
- **Cálculo de saldo**: função pura em `src/server/envelopes/queries.ts` que recebe dados crus e retorna saldo. Testável sem banco.

## Convenções de código

### TypeScript

- `strict: true` no `tsconfig.json`. Sempre.
- Sem `any`. Se precisar escapar, `unknown` + narrowing.
- Tipos do Prisma como fonte da verdade pra entidades. DTOs adicionais ficam em `src/types/`.

### Dinheiro

- Sempre em **centavos como `number`** (Int do Prisma).
- Formatação **só na borda da UI** via helper:
  ```ts
  // src/lib/money.ts
  export const formatBRL = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  export const parseBRLToCents = (input: string): number => { /* ... */ };
  ```
- Nunca passar reais (`1500.00`) entre camadas. Centavos da query até o componente.

### Datas e mês de referência

- Persistir `occurredAt` como `timestamptz`.
- Persistir `referenceMonth` como `String "YYYY-MM"`.
- Derivar `referenceMonth` de `occurredAt` no fuso `America/Sao_Paulo`:
  ```ts
  // src/lib/date.ts
  export const referenceMonthFromDate = (d: Date): string => /* "2026-06" */;
  export const currentReferenceMonth = (): string => /* baseado em now() em SP */;
  ```
- O "mês atual" da UI vem de `currentReferenceMonth()`, nunca de `new Date()` direto no componente.

### Server Actions

- Toda Server Action começa validando input com Zod.
- Retornam `{ ok: true, data } | { ok: false, error }` — sem throw pra fluxo controlado.
- Chamam `revalidatePath()` no final pra atualizar cache do RSC.

### Componentes

- Server Components por padrão. `"use client"` só quando precisar de estado/eventos.
- Forms via `<form action={serverAction}>` quando possível; `useFormStatus`/`useFormState` pra UX.

### Naming

- Arquivos: `kebab-case.ts` / `kebab-case.tsx`.
- Componentes React: `PascalCase`.
- Funções/variáveis: `camelCase`.
- Constantes globais: `SCREAMING_SNAKE_CASE`.

### Commits

- Convencional sem prefixo formal — frases curtas, imperativo, em PT-BR ou EN (consistente dentro de uma série).
- Exemplos: `cria schema inicial de envelopes`, `adiciona cálculo de saldo com carry-over`.

## Variáveis de ambiente

```
DATABASE_URL=postgresql://...           # Neon
DIRECT_URL=postgresql://...             # Neon (sem pooler, pra migrations)
AUTH_SECRET=...                         # se for NextAuth
# ou:
CERES_PASSWORD=...                      # se for senha única
```

`.env` no `.gitignore`. `.env.example` checked in.

## Testes

V1 sem framework de teste setado. **Exceção**: lógica de cálculo de saldo merece testes unitários desde o início (função pura, alta criticidade).

- Quando entrar: **Vitest** + **@testing-library/react**.
- Foco: `src/server/**/*.ts` e `src/lib/money.ts`, `src/lib/date.ts`. Componentes de UI ficam pra depois.

## CI/CD

- Vercel já dá: preview deploy por PR, prod deploy no merge em `main`.
- Antes de mergear, mínimo: `pnpm build` passa + `pnpm typecheck` passa. Configurar como required check no GitHub depois.
