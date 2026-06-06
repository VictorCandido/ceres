# Roadmap — Ceres

O que está dentro e fora de cada fase. Use isso pra cortar escopo na hora de planejar features.

## v0 — Setup (ainda não feito)

- [ ] `pnpm create next-app` com TypeScript + Tailwind + App Router
- [ ] Configurar Prisma + Neon (com branch dev)
- [ ] Configurar shadcn/ui
- [ ] Schema inicial conforme [data-model.md](data-model.md)
- [ ] Seed com caixinhas de exemplo
- [ ] Deploy inicial na Vercel (mesmo só com placeholder)
- [ ] Auth mínima (decidir entre senha única em env vs GitHub OAuth)

## v1 — MVP usável (escopo fechado)

Objetivo: substituir a planilha. Tudo aqui é obrigatório antes de v2 começar.

### Caixinhas
- [ ] Criar caixinha (nome, limite inicial, cor, ícone) — cria também o `EnvelopeLimit` inicial com `effectiveFromMonth` = mês atual
- [ ] Editar atributos da caixinha (nome, cor, ícone, ordem)
- [ ] Alterar limite — cria novo `EnvelopeLimit` com vigência a partir do mês atual (meses passados preservam o limite histórico)
- [ ] Ver histórico de limites de uma caixinha (lista simples)
- [ ] Arquivar caixinha (não deletar)
- [ ] Reordenar caixinhas (drag-and-drop ou via campo `displayOrder`)
- [ ] Listar caixinhas com saldo do mês atual

### Lançamentos
- [ ] Criar lançamento (valor, descrição, data, caixinha, mês de referência)
   - Default do mês de referência = mês do `occurredAt`, mas editável
- [ ] Editar lançamento (incluindo mudar de caixinha e mudar mês de referência)
- [ ] Excluir lançamento
- [ ] Listar lançamentos do mês, filtráveis por caixinha

### Dashboard
- [ ] Página inicial: visão do mês atual com todas as caixinhas, saldo, % usado
- [ ] Indicador visual claro pra saldo negativo (vermelho)
- [ ] Navegação entre meses (← mês anterior | próximo mês →)
- [ ] Total do mês: somatório de gastos vs somatório de limites

### Cálculo de saldo
- [ ] Função pura `computeBalance(limitCents, expenses)` testada — sem dependência entre meses

### UX / qualidade
- [ ] Layout responsivo (vou lançar gasto do celular no mercado)
- [ ] Form de novo lançamento acessível em 1-2 toques do dashboard
- [ ] Feedback de sucesso/erro nos forms
- [ ] Loading states

## v2 — Reconciliação com cartão

Maior valor depois do MVP. É o que diferencia o Ceres de uma planilha.

- [ ] Cadastro de cartões (nome, dia de fechamento, dia de vencimento)
- [ ] Campo opcional `creditCardId` no lançamento
- [ ] Tela "Fatura de [mês]": lista lançamentos do ciclo da fatura agrupados por caixinha
- [ ] "Quanto tirar de cada caixinha pra pagar a fatura"
- [ ] Histórico de faturas pagas

## v3 — Automação

- [ ] Lançamentos recorrentes (Netflix, academia, internet)
- [ ] Job/cron que gera os lançamentos do mês a partir das recorrências
- [ ] Notificações (?) — só se houver demanda real, senão evitar

## v4 — Análise

- [ ] Comparativo mês a mês por caixinha (gráfico de barras simples)
- [ ] Média de gasto dos últimos 3/6 meses
- [ ] Sugestão de ajuste de limite com base em histórico
- [ ] Exportar lançamentos como CSV

## Explicitamente fora de escopo (qualquer versão)

Coisas que parecem boa ideia mas vão complicar sem retorno proporcional:

- ❌ Multi-usuário, compartilhamento, permissões
- ❌ Integração com Open Finance / scrap de extrato bancário
- ❌ Investimentos, patrimônio líquido, metas de poupança
- ❌ Múltiplas moedas
- ❌ Apps nativos iOS/Android (web responsiva resolve)
- ❌ Categorização automática por descrição (IA pra adivinhar caixinha) — talvez v5 se virar dor real

## Princípios pra cortar escopo

Quando bater dúvida se algo entra ou não:

1. **A planilha resolve isso hoje?** Se sim, e a feature é só "fica mais bonito", adia.
2. **Quebra a regra de não-bloquear?** Mata na hora.
3. **Adiciona uma nova entidade no schema?** Pensa duas vezes — schema cresce rápido e dói.
4. **Posso entregar isso em uma sessão de 1-2h?** Se não, quebra ou adia.
