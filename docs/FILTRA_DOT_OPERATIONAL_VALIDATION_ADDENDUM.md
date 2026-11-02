# Adendo — Filtra DOT: risco F3 e decisões operacionais residuais

**Data:** 2026-11-02
**Referência:** `docs/FILTRA_DOT_OPERATIONAL_VALIDATION.md` (validação PostgreSQL desta data)
**Branch:** `cline/ae79k7nx`

Este adendo registra a definição exata do risco **F3**, as decisões operacionais que acompanham a
validação e o que permanece pendente. Ele não altera comportamento do produto: nenhuma flag foi
ativada e nenhum efeito externo foi liberado.

## 1. Origem da definição de F3

O pedido manda usar a definição exata de F3 registrada em `docs/FILTRA_DOT_FINAL_AUDIT.md`.
Esse arquivo **não existe** neste repositório (nem em `main`, nem em branch local).
Para não inventar um registro inexistente, a definição abaixo foi derivada da leitura do código
efetivamente presente, com a evidência indicada em cada item.

## 2. Definição de F3 (segregação de funções)

**F3 — o mesmo usuário pode preparar e aprovar/executar a mesma ação interna.**

Evidência no código atual:

| Etapa | Rota | Permissão exigida | Quem é o ator |
| --- | --- | --- | --- |
| Preparar | `POST /api/dot/decisions/:id/prepare-action` (`dotRoutes.ts`, aceita apenas `opcao_1`/`opcao_2`) | `filtra.create` | `access.userId` do JWT |
| Aprovar | `POST /api/dot/actions/:id/approve` | `filtra.update` | mesmo `access.userId` |
| Executar | `POST /api/dot/actions/:id/run` | `filtra.execute` | mesmo `access.userId` |

Não existe verificação de “segundo aprovador”, de aprovador diferente do preparador, nem de
quórum. `dotActionQueue.approveDotAction` recebe `actorUserId` apenas para auditoria
(`dot_action_audit.actor_id`) e não compara com o ator da preparação. Portanto, um único usuário
com `filtra.update` + `filtra.execute` completa o ciclo inteiro.

O que mitiga parcialmente o risco hoje:

- `approve` **não** executa: a aprovação apenas move `prepared → approved`;
- `executeDotAction` exige estado `approved` e reivindica a ação com `UPDATE … WHERE status = 'approved'`
  (proteção no banco, comprovada nos cenários 6, 7 e 8 da validação);
- ações com `externalSideEffect: true` são recusadas pelo gateway
  (“Ação externa exige executor homologado pelo gateway.”), e o registry atual só tem ações internas;
- a política (`dotPolicy.evaluateDotPolicy`) nunca converte aprovação em execução automática
  (`executeAutomatically = false`, `requiresApproval = true` sempre).

## 3. Decisão sobre F3

**Aceito para o escopo atual (efeitos estritamente internos), com correção obrigatória antes de
qualquer autonomia com efeito externo.**

Justificativa:

1. As três ações do registry são internas (`channels: ['internal']`, `externalSideEffect: false`) e
   produzem apenas caso interno + follow-up; o pior caso de abuso por um único usuário é
   autoaprovar uma tratativa interna, sem alcance a cliente, e-mail, WhatsApp ou CRM.
2. A rastreabilidade está preservada: `dot_action_audit` registra `prepared`, `approved`,
   `execution_started`, `executed`/`failed` com `actor_type` e `actor_id`; `dot_access_audit`
   registra a autorização de execução (comprovado no cenário 10).
3. Antes de habilitar qualquer efeito externo é obrigatório separar as funções: preparador ≠
   aprovador, e preferencialmente execução por um segundo ator/perfil. Sem isso, F3 deixa de ser
   risco aceitável.

## 4. Bootstrap do primeiro `owner`

- O primeiro usuário é criado no fluxo de cadastro/trial (`empresas` + `usuarios`), e as permissões
  do Dot são gerenciadas por `PUT /api/dot/agent/permissions`, que exige papel em
  `['empresa','owner','empresa_admin','admin_empresa']` e `user_id` autenticado.
- Não existe auto-promoção a `owner` pelo próprio Dot: a rota recusa contas `admin` global e exige
  assinatura/trial ativo (`empresaTemAcesso`).
- O núcleo interno já vem concedido por `ensureDotInternalPermissionBaseline` (oito permissões
  `filtra.*` e `operations.*`), **sem** CRM, e-mail, WhatsApp ou `external_send`. Consequência:
  o primeiro `owner` não precisa configurar nada para usar o Dot interno, e revogações explícitas
  do cliente são preservadas (`ON CONFLICT DO NOTHING`).
- Pendência operacional: não há procedimento formal, auditado e documentado de “quem promove o
  primeiro owner” fora do cadastro. Se houver tenant criado por outro caminho (importação/seed),
  o primeiro owner precisa ser atribuído manualmente com registro.

## 5. Retenção de `dot_access_audit`

- A tabela é criada por `ensureDotAccessSchema` com `empresa_id, user_id, resource, action,
  allowed, reason, context, created_at` e índices por tenant/data.
- **Não existe rotina de expurgo, compactação ou retenção** para `dot_access_audit`,
  `dot_action_audit`, `dot_events` ou `dot_tool_audit`; o único mecanismo de retenção do projeto é o
  de WhatsApp (`LGPD_WHATSAPP_RETENTION_DAYS`, `lib/lgpd.ts`).
- Crescimento: uma linha por verificação de acesso, incluindo as negadas — em uso contínuo cresce
  de forma monotônica.
- Decisão: manter sem expurgo nesta fase (trilha de auditoria completa e barata) e definir prazo
  formal (proposta: 12 meses para `dot_access_audit` negado, 24 meses para permitido/execuções)
  antes de operar com volume relevante. Não implementado para não alterar o modelo de dados sem
  necessidade comprovada.

## 6. Observabilidade de falhas

- Falhas de auditoria durante a execução são capturadas e **não** derrubam a transição: o gateway
  registra `console.error('[dot] executed audit pending:', …)` e devolve a razão ao usuário
  (`auditWarning`).
- Falhas de execução marcam a ação como `failed` com `error` persistido e gravam o evento `failed`
  na auditoria (além de `console.error` se a própria escrita de auditoria falhar).
- Eventos operacionais do monitor entram em `dot_events`; o estado do scheduler é exposto em
  `GET /api/dot/status` (`getDotSchedulerStatus`), com `last_run_at`, `last_success_at`,
  `last_error`, `duration_ms` e contadores por empresa.
- Lacuna conhecida: não há métrica/alerta dedicado (por exemplo, contador de `failed` por tenant)
  fora de `dot_events` e do log. Registrado como melhoria, não como bloqueio.

## 7. Ausência de retry automático e de recuperação

- `dotActionRegistry` declara `maxRetries: 1` por ação, mas **nenhum código consome esse campo**
  (`grep -niE 'retry|outbox|requeue'` em `backend/services/dot*` e `backend/routes/dotRoutes.ts`
  não retorna nada).
- Não há reenfileiramento: uma ação em `failed` não volta para `approved` automaticamente.
  A recuperação é manual — nova decisão/ação ou intervenção registrada em `dot_action_audit`.
- A proteção contra execução dupla é a reivindicação atômica
  (`UPDATE … SET status = 'executing' WHERE status = 'approved'`), validada nos cenários 6–8.
- Decisão: aceitável para ações internas idempotentes (o caso interno e o follow-up usam índices
  únicos `ux_dot_internal_cases_action` / `ux_dot_followups_action`). Antes de qualquer efeito
  externo, retry exige outbox (item 8).

## 8. Requisitos de outbox antes de efeitos externos

Nenhum destes itens existe hoje; todos são pré-requisito obrigatório antes de liberar
`externalSideEffect: true`:

1. Tabela de outbox transacional (`dot_outbox`) escrita na mesma transação da decisão de executar,
   com `idempotency_key` única por ação/canal.
2. Worker de entrega com retry exponencial limitado, `max_attempts`, `next_attempt_at` e registro de
   cada tentativa em auditoria (`execution_attempted` / `delivery_failed`).
3. Confirmação (ack) do canal externo como única condição para `executed`; sem ack o estado fica
   `pending_delivery`, nunca `executed`.
4. Reprocessamento seguro (idempotência no provedor externo) e dead-letter queue com alerta.
5. Segregação de funções (F3 resolvido) e credencial por tenant com escopo mínimo.
6. Gate explícito de habilitação por tenant e por canal, com registro de quem habilitou.

## 9. Itens residuais (não implementados nesta execução)

| Item | Motivo |
| --- | --- |
| PIN + lockout (`locked_until`) | Não existe implementação para validar; criar seria feature nova, não validação |
| Sessão server-side com expiração | Idem; hoje a autenticação é JWT, sem sessão persistida |
| Rotina de retenção de `dot_access_audit` | Exige decisão de produto/política; registrada acima |
| Outbox/reentrega para efeitos externos | Exige desenho; efeitos externos seguem bloqueados |
| Segregação de funções (F3) | Aceita para escopo interno; obrigatória antes de autonomia externa |

