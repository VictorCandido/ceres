# Ceres

App web pessoal de controle financeiro por **envelope budgeting** (método das caixinhas). Uso pessoal único, em PT-BR.

## Ideia central

O usuário paga tudo no cartão de crédito (pra acumular pontos), mas precisa controlar quanto gastou em cada categoria pra depois separar o dinheiro e pagar a fatura. O Ceres é onde ele:

1. Define caixinhas (categorias) com limite mensal.
2. Lança cada gasto na caixinha correspondente.
3. Vê em tempo real quanto sobra (ou ficou negativo) em cada caixinha no mês.

O sistema **nunca bloqueia** um lançamento por estourar o limite — só mostra negativo.

## Stack

- **Next.js 15+ (App Router) + TypeScript**
- **Postgres** (Neon) via **Prisma**
- **Tailwind CSS** + **shadcn/ui** pra UI
- Deploy: **Vercel**
- Autenticação: simples (uso pessoal — provavelmente um secret ou OAuth GitHub)

Detalhes em [docs/architecture.md](docs/architecture.md).

## Documentos de arquitetura

Antes de planejar ou implementar qualquer feature, leia:

- [docs/domain.md](docs/domain.md) — entidades, regras de negócio, glossário
- [docs/data-model.md](docs/data-model.md) — schema do banco, relacionamentos
- [docs/architecture.md](docs/architecture.md) — stack, estrutura de pastas, convenções de código
- [docs/roadmap.md](docs/roadmap.md) — o que está em v1, v2, e o que está **fora de escopo**

## Convenções

- **Idioma**: código em inglês (identificadores, comentários, commits), UI e textos pro usuário em **PT-BR**.
- **Dinheiro**: armazenar como inteiro em centavos (`bigint`/`number`). Nunca `float`.
- **Datas**: armazenar como `timestamptz` no Postgres; lidar em UTC no servidor; renderizar em `America/Sao_Paulo` na UI.
- **Mês de referência**: usar `YYYY-MM` (string) ou `(year, month)` consistentemente. Ver [docs/domain.md](docs/domain.md#ciclo-mensal).
- **IDs**: `uuid` (Postgres `gen_random_uuid()` via Prisma `@default(dbgenerated("gen_random_uuid()"))` ou `@default(uuid())` no client).

## Comandos

A serem definidos quando o projeto for inicializado. Esperado:

- `pnpm dev` — servidor de desenvolvimento
- `pnpm build` / `pnpm start`
- `pnpm prisma migrate dev` — aplicar migration local
- `pnpm prisma studio` — explorar dados

## Estado atual

Projeto na fase de **arquitetura**. Nenhum código foi escrito ainda. Próximo passo: inicializar o app Next.js e modelar o schema Prisma com base em [docs/data-model.md](docs/data-model.md).
