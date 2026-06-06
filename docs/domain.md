# Domínio — Ceres

Modelo de domínio e regras de negócio. Esta é a **fonte da verdade** sobre como o Ceres funciona. Mudanças de regra de negócio passam por aqui antes de virarem código.

## Glossário (linguagem ubíqua)

| Termo PT-BR | Termo no código | Definição |
|---|---|---|
| Caixinha | `Envelope` | Categoria de gasto (ex: Supermercado, Gasolina, Lazer). Atributos não financeiros (nome, cor, ícone, carry-over). |
| Limite (vigência) | `EnvelopeLimit` | Valor do limite mensal de uma caixinha **a partir de um mês**. Mantém histórico — alterar limite cria novo registro, não sobrescreve. |
| Lançamento | `Expense` | Um gasto único registrado dentro de uma caixinha. |
| Mês de referência | `referenceMonth` | O mês a que um lançamento pertence pra fins de orçamento (formato `YYYY-MM`). |
| Saldo | `balance` | `limiteVigente − somaDosLançamentosNoMês`. Pode ser negativo. |

## Entidades

### Envelope (Caixinha)

- Nome (ex: "Supermercado")
- Cor / ícone (opcional, pra UI)
- Flag `archived` (boolean) — caixinhas arquivadas não aparecem nas telas principais mas mantêm histórico
- Ordem de exibição (`displayOrder`)

> **Observação**: o limite **não** é um campo do `Envelope`. Vive na entidade `EnvelopeLimit` (ver abaixo) pra preservar histórico.

### EnvelopeLimit (Limite com vigência)

- Caixinha (FK)
- Limite em centavos (`limitCents`)
- Mês de início de vigência (`effectiveFromMonth`, formato `YYYY-MM`)

Uma caixinha tem **um ou mais** registros de `EnvelopeLimit`. O limite vigente num mês `M` é o registro com maior `effectiveFromMonth <= M`. Quando o usuário cria uma caixinha, um `EnvelopeLimit` inicial é criado automaticamente com `effectiveFromMonth = mês atual`.

### Expense (Lançamento)

- Valor em centavos (sempre positivo; é um gasto)
- Data do gasto (`occurredAt` — quando aconteceu na vida real)
- Mês de referência (`referenceMonth` — derivado de `occurredAt` por padrão, mas editável)
- Descrição (texto livre, opcional)
- Caixinha (FK)
- `createdAt` / `updatedAt`

> **Por que `referenceMonth` é separado de `occurredAt`?** Compra parcelada, ou um gasto que conceitualmente pertence a outro mês (ex: comprei no dia 31 mas é orçamento do mês que vem). O usuário pode reatribuir.

## Regras de negócio

### Ciclo mensal

- O ciclo é **mês-calendário** (dia 1 ao último dia do mês), em `America/Sao_Paulo`.
- Cada lançamento tem um `referenceMonth` (`YYYY-MM`) que define a qual ciclo ele pertence.
- O usuário navega entre meses na UI. O "mês atual" default é o mês corrente.
- **Não há fechamento manual** de mês. Meses passados são imutáveis na prática (o usuário pode editar, mas a UI não incentiva).
- **Cada mês é independente**: saldo sobrando ou negativo **não** acumula pro mês seguinte. Todo mês começa do zero, com o limite vigente daquele mês.

### Cálculo do saldo

Pra uma caixinha `E` num mês `M`:

```
limiteVigente(E, M) = EnvelopeLimit.limitCents onde envelopeId = E
                      e effectiveFromMonth = max(effectiveFromMonth <= M)
gastoTotal(E, M) = soma de Expense.amountCents onde envelopeId = E e referenceMonth = M
saldo(E, M) = limiteVigente(E, M) − gastoTotal(E, M)
```

Não há dependência entre meses: o saldo de `M` se calcula só com dados de `M`.

### Alteração de limite

Quando o usuário edita o limite de uma caixinha:

- **Default**: o novo limite vale **a partir do mês atual** (cria novo `EnvelopeLimit` com `effectiveFromMonth = mês atual`). Meses passados ficam intocados.
- Se já existe um `EnvelopeLimit` com `effectiveFromMonth = mês atual`, o registro é atualizado em vez de criar duplicado (constraint única em `(envelopeId, effectiveFromMonth)`).
- O usuário pode opcionalmente escolher outro mês de início de vigência (ex: aplicar retroativo a partir de janeiro) — mas isso é caso de borda na UI, não o fluxo principal.
- Excluir/editar registros antigos de `EnvelopeLimit` é permitido (caso de correção de erro), mas não é o fluxo padrão de mudar limite.

**Invariante**: toda caixinha tem **pelo menos um** `EnvelopeLimit`. Não é possível ficar sem limite vigente.

### Sem bloqueio por estouro

Lançamentos **nunca** são bloqueados ou alertados de forma intrusiva por estourar o limite. A UI mostra saldo negativo em vermelho — só isso.

### Edição / exclusão

- Lançamentos podem ser editados ou excluídos a qualquer momento.
- Mudar o `envelopeId` ou `referenceMonth` de um lançamento existente recalcula os saldos automaticamente (são derivados, não armazenados).
- Mudar o limite cria um novo `EnvelopeLimit` com vigência a partir do mês atual; meses anteriores **preservam** o limite que estava vigente naquele momento.

## Decisões em aberto

Itens que estão fora da v1 mas precisam ser pensados antes de virar feature:

1. **Lançamentos recorrentes** (Netflix, academia): fora da v1. Quando entrar, virar uma entidade `RecurringExpense` que gera `Expense` automaticamente todo mês.
2. **Reconciliação com fatura do cartão**: fora da v1. Quando entrar, modelar `CreditCard` com `closingDay`/`dueDay` e um endpoint `/cards/[id]/bill/[month]` que agrega lançamentos do ciclo.
3. **Múltiplos usuários**: fora. App é pessoal.
4. **Múltiplas formas de pagamento**: fora da v1. Assume-se "tudo no cartão". Quando entrar, adicionar `paymentMethod` ao `Expense`.

## Invariantes (devem sempre ser verdadeiras)

- `Expense.amountCents > 0`
- `EnvelopeLimit.limitCents >= 0`
- Toda `Envelope` tem pelo menos um `EnvelopeLimit`
- `Expense.referenceMonth` e `EnvelopeLimit.effectiveFromMonth` matcham `^\d{4}-(0[1-9]|1[0-2])$`
- Único por `(envelopeId, effectiveFromMonth)` em `EnvelopeLimit`
- Excluir uma caixinha com lançamentos: bloquear ou exigir reatribuição (a decidir na feature; preferência: bloquear).
