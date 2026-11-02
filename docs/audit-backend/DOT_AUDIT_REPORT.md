# Auditoria do Filtra Dot — backend `LU9DI/backend`

**Data:** 2026-11-02
**Repositório auditado:** `LU9DI/backend` (branch base `master`, HEAD `b8caf40`)
**Branch da auditoria:** `audit/dot-security-audit`
**Frontend relacionado:** `LU9DI/saas-reputacao-ia` (`frontend/src/app/dot/page.tsx`) — inspecionado, sem alteração
**Produção:** Render `filtra-ia-api` — **não acessado e não alterado** (fora do escopo permitido)

---

## 1. Resumo executivo

O Filtra Dot no backend é um subsistema maduro: gate único de plano, propriedade
autoritativa por `empresa_owners` (nunca por `role` do JWT), permissões granulares,
PIN administrativo com `scrypt` + lockout persistido, sessão administrativa opaca
vinculada a empresa+usuário, barreira de aprovação, locks duráveis no banco e
trilhas de auditoria. Não encontrei vulnerabilidade crítica ou alta nos caminhos
auditados.

Encontrei e **corrigi** quatro defeitos reais (um de severidade média-alta em
auditoria, dois médios, um baixo), todos com teste de regressão:

| # | Severidade | Achado | Situação |
| --- | --- | --- | --- |
| F1 | Média | A preparação de ação registrava ator `dot` mesmo quando pedida por um usuário autenticado — a auditoria não atribuía quem preparou | Corrigido |
| F2 | Média | A auditoria da preparação era gravada **fora** da transação: falha de auditoria deixava ação preparada sem trilha (ação podia ser aprovada/executada sem registro de origem) | Corrigido |
| F3 | Baixa | Repetir a preparação gerava **eventos `prepared` duplicados** para a mesma ação (trilha inflada) | Corrigido |
| F4 | Baixa | `DELETE /api/dot/admin/session` revogava a sessão **sem o cabeçalho `X-Dot-Admin`**, divergindo da matriz documentada (mutation sujeita a CSRF) | Corrigido |

Estado final medido: **286 testes, 286 aprovados, 0 falhas, 0 ignorados**;
`tsc --noEmit` sem erros; `npm audit --omit=dev` com 3 advisories **moderados**
em dependências (não relacionados ao Dot e não alterados nesta auditoria).

**Recomendação:** o Dot **não está pronto para ativação em produção** ainda — não por
falha de segurança conhecida, mas porque: (a) a validação de concorrência/locks foi
executada apenas em SQLite, sem execução real em PostgreSQL; (b) não há teste
end-to-end de navegador; (c) as decisões operacionais de F3-do-relatório-anterior
(segregação preparador ≠ aprovador) continuam pendentes para efeitos externos.
Detalhes e critérios objetivos na seção 12.

## 2. Arquitetura auditada

```
Frontend /dot (Next.js)
   └── apiFetch (failover de host) → API Express
                                     │
        gate único: services/dotAccessGate.ts (resolveDotGate)
          JWT → empresa → assinatura/trial → plano rei/corporativo → empresa_owners
                                     │
        permissões granulares: services/dotAccessControl.ts (dot_agent_permissions)
                                     │
   ┌─────────────────────────┬───────────────┬──────────────────────────┐
   │ leitura/chat/decisões   │ preparação    │ execução (PIN)           │
   │ routes/dotRoutes.ts     │ dotActionQueue│ requireDotAdminSession   │
   └─────────────────────────┴───────────────┴──────────────────────────┘
                                     │
        services/dotExecutionGateway.ts (claim atômico + política + auditoria)
                                     │
        services/dotInternalExecutors.ts (caso interno) + dotFollowUp.ts
                                     │
        background: dotScheduler.ts (FORCE_ON, off) · dotAgentWorker.ts ·
        dotAgentMissionRunner.ts (lock em memória + claim durável via dotCoordination.ts)
```

Camadas de proteção administrativa: `dot_admin_pins` (hash scrypt+salt, versão),
`dot_admin_pin_attempts` (falhas, atraso progressivo, `lock_until`),
`dot_admin_sessions` (token opaco de 256 bits, hash sha256 no banco, TTL, revogação,
versão do PIN).

## 3. Arquivos e módulos inspecionados

Leitura integral ou revisão dirigida (backend auditado):

| Área | Arquivos |
| --- | --- |
| Gate e propriedade | `services/dotAccessGate.ts`, `lib/empresaOwnership.ts`, `lib/auth.ts`, `lib/jwtKeys.ts` |
| Admin (PIN/sessão) | `services/dotAdminSecurity.ts`, `routes/dotAdminRoutes.ts` |
| Permissões | `services/dotAccessControl.ts`, `routes/dotAccessRoutes.ts` |
| Fila e execução | `services/dotActionQueue.ts`, `services/dotExecutionGateway.ts`, `services/dotActionAudit.ts`, `services/dotActionRegistry.ts`, `services/dotInternalExecutors.ts`, `services/dotFollowUp.ts` |
| Rotas de empresa/agente | `routes/dotRoutes.ts`, `routes/dotAgentRoutes.ts`, `routes/dotAgentMissionRoutes.ts` |
| Background | `services/dotAgentWorker.ts`, `services/dotAgentMissionRunner.ts`, `services/dotAgentMissions.ts`, `services/dotScheduler.ts`, `services/dotCoordination.ts`, `services/dotMonitor.ts` |
| Auditoria | `lib/auditLog.ts`, tabelas `dot_action_audit`, `dot_access_audit`, `audit_logs` |
| Documentos | `docs/DOT_PRODUCAO.md` (186 linhas), `docs/DOT_LOCAL.md` (29 linhas) |
| Testes existentes | 22 arquivos `tests/dot*.test.ts` (79 casos antes desta auditoria) |
| Frontend | `frontend/src/app/dot/page.tsx`, `frontend/src/app/utils/apiFailover.ts` |

Dependências do subsistema: `express`, `cookie-parser`, `express-rate-limit`,
`jsonwebtoken`, `bcrypt`, `node:crypto` (scrypt), `pg`/`sqlite`, `tsx`.
Tabelas: `dot_agent_permissions`, `dot_access_audit`, `dot_events`, `dot_decisions`,
`dot_action_queue`, `dot_action_audit`, `dot_internal_cases`, `dot_followups`,
`dot_tool_audit`, `dot_agent_goals`, `dot_agent_missions`, `dot_agent_mission_steps`,
`dot_admin_pins`, `dot_admin_pin_attempts`, `dot_admin_sessions`, `dot_locks`,
`empresa_owners`, `audit_logs`.

## 4. Vulnerabilidades encontradas (com severidade)

Nenhuma vulnerabilidade **crítica** ou **alta** foi encontrada nos caminhos do Dot.
Achados relevantes, todos corrigidos nesta branch:

### F1 — Auditoria da preparação não registrava o ator autenticado (Média)

- **Antes:** `prepareDotActionFromDecision(empresaId, decisionId, optionId)` gravava
  sempre `actor_type='dot'`, `actor_id=NULL`. A rota `POST /api/dot/decisions/:id/prepare-action`
  não informava o usuário, então uma preparação pedida por uma pessoa aparecia na
  trilha como se fosse automática do agente.
- **Impacto:** quebra de atribuição em auditoria (quem preparou a ação), dificulta
  investigação e contradiz a matriz de auditoria do produto. Não permite escalada
  de privilégio por si só.
- **Correção:** parâmetro opcional `actorUserId`; `actor_type='user'` + `actor_id`
  quando informado; chamadas do próprio Dot (monitor, follow-up, resolve
  automático) continuam `dot`/`NULL`.
- **Evidência de que o teste pega o defeito:** com a correção revertida
  (`git stash` temporário), `prepare registra o ator autenticado…` **falha**; com a
  correção, passa (ver seção 7).

### F2 — Auditoria da preparação fora da transação (Média)

- **Antes:** a ação era criada e a decisão promovida dentro de `withDbTransaction`,
  mas o evento `prepared` era gravado **depois** do commit, com `recordDotActionAudit`
  (que engole erro de escrita em alguns caminhos). Se a auditoria falhasse, restava
  uma ação preparada **sem nenhuma trilha** — aprovável e executável.
- **Impacto:** integridade da trilha de aprovação/execução; a barreira de aprovação
  continuaria funcionando, mas sem prova de origem.
- **Correção:** o `INSERT` em `dot_action_audit` passou para dentro da mesma
  transação (mesmo padrão já usado em `approveDotAction`). Falha de auditoria →
  rollback integral (ação **e** decisão voltam ao estado original).

### F3 — Eventos `prepared` duplicados em preparações repetidas (Baixa)

- **Antes:** cada chamada a `prepareDotActionFromDecision` gravava um evento
  `prepared`, inclusive quando devolvia a ação **já existente** (deduplicação).
  Duas chamadas → dois eventos para a mesma ação.
- **Impacto:** trilha inflada; contagem de transições deixa de ser 1:1 com o estado.
- **Correção:** a auditoria só é gravada no caminho de criação; o caminho de
  deduplicação retorna a ação existente sem novo evento.

### F4 — Revogação de sessão administrativa sem cabeçalho anti-CSRF (Baixa)

- **Antes:** `DELETE /api/dot/admin/session` exigia apenas cookie de sessão válido;
  `X-Dot-Admin: 1` **não** era verificado, embora `docs/DOT_PRODUCAO.md` §7 declare
  cabeçalho obrigatório em todas as mutações administrativas.
- **Impacto:** CSRF de *logout* (derrubar a sessão administrativa de um proprietário
  enquanto ele navega). Não executa ações nem altera dados; é negação de
  disponibilidade momentânea.
- **Correção:** `ensureHeader(req)` antes de qualquer efeito; sem cabeçalho →
  `403 DOT_ADMIN_HEADER_REQUIRED` e a sessão **permanece** ativa.

### Riscos avaliados e **não** classificados como vulnerabilidade

| Item | Análise |
| --- | --- |
| Decisões administrativas dependendo de `role` do JWT | **Não ocorre.** `role` só é usado para *negar* admin de plataforma (`isAdminUser`). Propriedade vem de `empresa_owners`; permissões de `dot_agent_permissions`; execução de sessão de PIN. Coberto por `Dot ownership comes from empresa_owners, never from role claims` |
| Aprovação não exigir sessão administrativa | **Por desenho documentado** (§7): aprovar não executa; executar exige PIN. Um funcionário com `filtra.update` poderia aprovar, mas não executar. Mantido — alterar seria mudança de política (ver seção 9) |
| IDOR entre empresas | Todas as consultas/updates verificadas filtram `empresa_id` (`dot_action_queue`, `dot_decisions`, `dot_followups`, `dot_events`, missões, etapas, permissões). Coberto por testes de isolamento |
| Replay / dupla execução | `approve` exige `status='prepared'` na transação; execução usa claim `UPDATE … WHERE status='approved'`; segunda chamada recebe 409. Coberto por testes de idempotência e concorrência |
| Concorrência entre instâncias | Locks duráveis `dot_locks` com TTL + claim atômico; missões usam `withDotLock(mission:…, 120s, waitMs=30s)` e devolvem `blocked` sem reexecutar |
| PIN/lockout | `scrypt` N=32768 com salt individual, comparação `timingSafeEqual`; atraso progressivo 0/2/5/10/30 s; bloqueio 10 min → 1 h → 24 h, persistido, nunca permanente; reset de contador só após bloqueio longo expirado |
| Sessão administrativa | Token 256 bits, hash sha256 no banco, vínculo empresa+usuário, TTL 5–480 min (padrão 30), revogação explícita e invalidação por versão do PIN |
| Redação em logs/respostas | `dotRedaction` cobre telefone/e-mail/token (testes existentes); respostas de PIN nunca ecoam o PIN (`testes: 'a auditoria registra falhas sem nunca conter o PIN'`, `resposta nunca contém o PIN`) |
| Rate limiting | `unlockLimiter` 20/15 min e `pinSetupLimiter` 10/15 min nas rotas de PIN; `dotLimiter` nas rotas de chat/monitor/resolve/explain. `approve`/`run` não têm limiter próprio — protegidos por sessão + permissão + idempotência |

## 5. Falhas funcionais encontradas

1. **Trilha de preparação sem ator** (F1) — o painel mostrava a ação como preparada
   pelo Dot mesmo quando o usuário clicou.
2. **Ação preparada sem trilha em falha de auditoria** (F2).
3. **Contagem de transições divergente** em preparações repetidas (F3).
4. **Inconsistência entre documentação e código** no `DELETE /api/dot/admin/session` (F4).

Nenhuma falha funcional adicional foi encontrada em: gate de plano
(rei/corporativo/aliases), assinatura inativa, token ausente/inválido/expirado,
propriedade, sessão expirada/revogada, aprovação, execução, missões e worker.


## 6. Correções implementadas

| Arquivo | Mudança |
| --- | --- |
| `services/dotActionQueue.ts` | `prepareDotActionFromDecision` aceita `actorUserId` opcional; grava o evento `prepared` **dentro da transação**, com `actor_type` derivado do ator e sem duplicar no caminho de deduplicação; `ensureDotActionAuditSchema()` chamado antes da transação; import não utilizado removido |
| `routes/dotRoutes.ts` | `POST /api/dot/decisions/:id/prepare-action` passa `access.userId` como ator da preparação |
| `routes/dotAdminRoutes.ts` | `DELETE /api/dot/admin/session` exige `X-Dot-Admin: 1` (`ensureHeader`) antes de revogar |
| `tests/dotActionAuditIntegrity.test.ts` (novo) | 4 testes de regressão de integridade da auditoria |
| `tests/dotRouteProtection.test.ts` | 2 testes de regressão HTTP (cabeçalho no DELETE; ator na preparação via API) |

Nenhuma refatoração cosmética foi feita. Nenhuma mudança de política, schema
destrutivo, dependência, variável de ambiente ou configuração de produção.

## 7. Testes executados e resultados (reais)

### Baseline antes das correções

| Comando | Resultado |
| --- | --- |
| `npm ci` | 201 pacotes instalados |
| `npm test` (1ª execução) | `tests 280 · pass 159 · cancelled 65` — **falha ambiental**: o binário `sqlite3` pré-compilado exigia `GLIBC_2.38` e o ambiente tem 2.36 (`SQLite não instalado`) |
| `npm rebuild sqlite3 --build-from-source` | binário recompilado para a glibc local |
| `npm test` (2ª execução, baseline limpo) | **`tests 280 · pass 280 · fail 0 · cancelled 0 · skipped 0`** |

### Prova de que os testes novos pegam o defeito (antes × depois)

Com a correção temporariamente removida (`git stash push` apenas nos arquivos de
produção, restaurado em seguida no mesmo comando):

```
✖ prepare registra o ator autenticado que pediu a preparação
✔ prepare automático do Dot continua auditado como ator dot, sem ator humano
✖ prepare repetido mantém exatamente uma transição prepared (idempotência da trilha)
✖ falha ao gravar a auditoria reverte a preparação (sem ação órfã)
tests 4 · pass 1 · fail 3
```

Com as correções aplicadas: `tests 4 · pass 4 · fail 0`.
O único teste que já passava é o que garante que a preparação automática do Dot
continua classificada como `dot` — a correção não muda a semântica do agente.

### Execução final (após as correções)

| Comando | Resultado |
| --- | --- |
| `npm test` | **`tests 286 · pass 286 · fail 0 · cancelled 0 · skipped 0`** (`TEST_EXIT=0`) |
| `npm run build` (`tsc --noEmit`) | **exit 0**, nenhum erro de tipo |
| `npm audit --omit=dev` | **3 vulnerabilidades moderadas** (exit 1): `qs ≤6.16` via `express` (DoS em `qs.stringify`) e `@hono/node-server ≤2.1.2` (`serveStatic` com decodificação dupla) — nenhuma no código do Dot; **não alteradas** (seção 9) |
| `node --import tsx --test tests/dotRouteProtection.test.ts` | `tests 9 · pass 9 · fail 0` |
| `node --import tsx --test tests/dotActionAuditIntegrity.test.ts` | `tests 4 · pass 4 · fail 0` |


### Matriz dos 20 cenários exigidos × evidência

| # | Cenário | Cobertura | Evidência (teste) |
| --- | --- | --- | --- |
| 1 | Empresa Rei autorizada | ✅ | `dotAgentPlanGate`: `libera workspace, permissions, tools e missions para rei/corporativo/corp/corporate` |
| 2 | Empresa Corporativa autorizada | ✅ | idem (`corporativo`, `corp`, `corporate`) |
| 3 | Planos sem direito | ✅ | `nega trial de 7 dias`, `nega planos fora da matriz` |
| 4 | Assinatura inativa | ✅ | idem (`empresa bloqueada`) + `empresaTemAcesso` no gate |
| 5 | Token ausente/inválido/expirado | ✅ | `nega sem token e com token inválido`; expiração em `tests/jwtRotation.test.ts` |
| 6 | Usuário de outra empresa | ✅ | `não aprova/executa ação de outra empresa`, `não cruza empresas` |
| 7 | Funcionário em operação de proprietário | ✅ | `funcionário com papel padrão não administra`, `funcionário não cadastra PIN`, `ferramenta de leitura… execução exige sessão` |
| 8 | Proprietário sem PIN configurado | ✅ | `primeiro cadastro é único…`; `pin_configured=false` + 409 `DOT_ADMIN_PIN_NOT_SET` |
| 9 | PIN incorreto, bloqueio e desbloqueio | ✅ | `atraso progressivo e bloqueio temporário persistem no banco e expiram` |
| 10 | Sessão expirada ou revogada | ✅ | `expiração e revogação invalidam a sessão`, **novo** `DELETE … sem X-Dot-Admin é recusado e não revoga a sessão` |
| 11 | Aprovação de ações | ✅ | `fluxo completo pela API com a missão vinculada` |
| 12 | Auditoria com ator correto | ✅ | `DOT execution audit preserves the authenticated actor`, **novos** `prepare registra o ator autenticado…` |
| 13 | Rollback quando a auditoria falha | ✅ | trigger de falha na aprovação + **novo** `falha ao gravar a auditoria reverte a preparação` |
| 14 | Execução sem aprovação | ✅ | `an action cannot execute before approval` |
| 15 | Execução sem permissão | ✅ | `execution requires explicit permission` |
| 16 | Duas aprovações concorrentes | ✅ | `concurrent approvals consume the same action only once` |
| 17 | Duas execuções concorrentes | ✅ | `executar duas vezes não duplica caso interno nem follow-up` |
| 18 | Repetição / idempotência | ✅ | `aprovar duas vezes não duplica efeito`, **novo** `prepare repetido mantém exatamente uma transição prepared` |
| 19 | Falhas de banco e recuperação | ✅ parcial | `requireDotAdminSession… (falha fechada)`, **novo** rollback por falha de auditoria, `dotCoordination: segunda aquisição falha enquanto a primeira está válida`. **Pendente:** falha real de PostgreSQL (seção 8) |
| 20 | Isolamento de dados entre empresas | ✅ | `dotCoreRegression` (preparar/aprovar/executar/listar por tenant), `dotAccessControl`, `dotAgentPlanGate` |

Todos os testes usam bancos SQLite temporários isolados (`/tmp/filtra-dot-*.sqlite`)
com empresas e usuários **fictícios** (`crypto.randomUUID()`) e dados sintéticos.
Nenhum dado de cliente real foi usado.


## 8. Testes que não puderam ser realizados e motivo

| Item | Motivo | Como executar depois |
| --- | --- | --- |
| Concorrência/locks em **PostgreSQL real** | O ambiente não tem PostgreSQL instalado; a suíte usa SQLite, engine padrão dos testes do projeto. O adapter `lib/db.pg.ts` não foi exercitado | Provisionar cluster descartável (loopback, porta dedicada), rodar a suíte com `DATABASE_URL` para ele e repetir concorrência com conexões independentes |
| Verificação do serviço Render `filtra-ia-api` | Sem acesso ao painel e por regra explícita (não tocar produção). Não é possível confirmar `FILTRA_DOT_ENABLED`, `FILTRA_DOT_FORCE_ON`, `DOT_AGENT_WORKER_ENABLED` reais | Conferir no painel do Render por um responsável e comparar com `docs/DOT_PRODUCAO.md` §2 |
| Chamadas reais a Groq/Gemini | Exigiria chaves e consumo pago; o pedido manda simular | Smoke manual com chave de teste; o caminho 503 sem chave está implementado e documentado |
| E2E de navegador do painel `/dot` | Sem browser headless aqui; revisão do frontend foi estática | Playwright/Cypress com frontend buildado + API |
| Migrações repetidas em PostgreSQL | Mesmo motivo do primeiro item | Rodar `ensureDotSchema`/`ensureDotAdminSecuritySchema` 2× e comparar `information_schema` |
| Carga real do monitor | `FILTRA_DOT_FORCE_ON` deve permanecer desligado (regra) | `POST /api/dot/monitor/run` manual com empresa de teste, em horário de baixa |

## 9. Riscos residuais

1. **Segregação de funções (preparador ≠ aprovador)** — o mesmo proprietário prepara,
   aprova e executa; a execução exige PIN, mas não há segundo aprovador. Aceitável
   enquanto todas as ações são internas (`external_side_effect=false`);
   **bloqueante** antes de qualquer efeito externo. Exige decisão de política antes
   de implementar — registrado, não alterado.
2. **Aprovação sem sessão administrativa** — decisão de desenho documentada (§7 de
   `docs/DOT_PRODUCAO.md`). Recomendação: exigir sessão também na aprovação quando
   surgirem ações externas ou quando o tenant tiver mais de um usuário com
   `filtra.update`.
3. **`audit_logs` é best-effort** — `writeAudit` engole erro de escrita (só
   `console.warn`). Para PIN/sessão isso afeta apenas a trilha, mas não é transacional
   como `dot_action_audit` agora é.
4. **`apiFetch` reenvia a requisição a outro host** em 502/503/504/timeout. Em
   mutações a duplicação é limitada pelo backend (aprovar → 409; executar → claim;
   preparar → dedupe), mas `POST /api/dot/admin/session` pode criar **duas sessões**
   válidas. Impacto baixo (expiram/revogam juntas).
5. **Dependências com advisory moderado** (`qs` via `express`,
   `@hono/node-server`): não exploráveis pelo fluxo do Dot como escrito; tratar em PR
   de dependências.
6. **Sem rate limit dedicado em `approve`/`run`**: mitigado por sessão de PIN,
   permissão e idempotência.
7. **Retenção de auditoria** (`dot_access_audit`, `dot_action_audit`, `dot_events`)
   sem expurgo definido — crescimento monotônico.


## 10. Situação da integração frontend/backend

Revisão estática de `frontend/src/app/dot/page.tsx` (326 linhas) e
`frontend/src/app/utils/apiFailover.ts`. **Nenhuma alteração foi necessária.**

| Item | Situação |
| --- | --- |
| Rotas consumidas | `/api/dot/status`, `/decisions`, `/actions`, `/cases`, `/followups`, `/events`, `/briefing`, `/admin/state`, `/admin/pin`, `/admin/pin/reset`, `/admin/session` (POST/DELETE), `/actions/:id/approve`, `/actions/:id/run`, `/decisions/:id/prepare-action`, `/monitor/run` — todas existem no backend |
| Autenticação | `Authorization: Bearer` do `localStorage` + `credentials: 'include'` (cookie HttpOnly do backend) |
| Cabeçalho anti-CSRF | `X-Dot-Admin: 1` enviado em todas as chamadas do painel (necessário para mutações) |
| Cookies | Sessão administrativa em cookie HttpOnly com `path=/api/dot`; o frontend não lê o token |
| 401/403 | `getJson` lança erro com o `error` do backend e a página exibe o motivo; 403 de plano mostra a mensagem de acesso antecipado |
| 404/503 | Ação inexistente → 404/409 exibido; chat sem chave de IA → 503 com mensagem do backend |
| Plano e permissões | Selo de plano (`plan_label`) e estado `enabled`; cartão de administração só aparece com `adminState.is_owner` |
| PIN | Cadastro, desbloqueio, redefinição (com senha) e bloqueio implementados na UI |
| Fluxo de ações | Preparar → Aprovar → Executar com os estados `prepared`/`approved` e botões correspondentes |
| Responsividade | Layout em grid com `sm:`/`lg:`; sem regressão identificada na leitura |

## 11. Situação de cada PR criado

**Nenhum PR pôde ser aberto.** A conta de automação desta sessão não tem permissão de
escrita no repositório `LU9DI/backend`:

```
$ git push -u origin audit/dot-security-audit
remote: Permission to LU9DI/backend.git denied to cline-cloud[bot].
fatal: ... The requested URL returned error: 403

$ gh api repos/LU9DI/backend --jq '.permissions'
{"admin":false,"maintain":false,"pull":false,"push":false,"triage":false}
```

| Item | Estado |
| --- | --- |
| Branch local | `audit/dot-security-audit` (3 commits sobre `b8caf40`) |
| Branch no remoto | **não publicada** (403) |
| PR em `LU9DI/backend` | **não criado** (sem permissão) |
| `master` | intacta (`b8caf40`) — nenhum merge, nenhum commit direto |
| Entrega alternativa | 3 patches `git format-patch` gerados (abaixo) para o revisor aplicar |
| Frontend | nenhuma alteração necessária; nenhum PR |

Commits da branch:

```
389cba7 docs(dot): relatório da auditoria de segurança e integração
36ba938 test(dot): regressão de auditoria da preparação e cabeçalho no DELETE de sessão
96780b6 fix(dot): auditoria atômica e com ator na preparação; CSRF no bloqueio de sessão
b8caf40 (base) fix(dot): registrar ator autenticado na aprovação de ações
```

Para publicar/revisar, basta, com uma conta que tenha `push`:

```bash
git checkout -b audit/dot-security-audit origin/master
git am 0001-*.patch 0002-*.patch 0003-*.patch
git push -u origin audit/dot-security-audit
gh pr create --base master --head audit/dot-security-audit \
  --title "audit(dot): integridade de auditoria da preparação e CSRF no bloqueio de sessão"
```

Os patches também foram preservados em `docs/audit-backend/` do repositório
`LU9DI/saas-reputacao-ia` (branch `cline/ae79k7nx`) para não se perderem com o
ambiente efêmero.


## 12. Recomendação objetiva sobre prontidão para produção

**NÃO ativar o Dot em produção nesta rodada.** Classificação: **APROVADO COM
RESSALVAS** para o escopo interno, **NÃO APROVADO** para ativação.

Critérios já atendidos (com evidência executada):

- isolamento entre empresas testado em todas as operações sensíveis (preparar,
  aprovar, executar, listar, permissões, missões);
- proteção administrativa testada: propriedade por `empresa_owners`, PIN com scrypt,
  lockout persistido, sessão com expiração/revogação/versionamento e cabeçalho
  anti-CSRF em **todas** as mutações administrativas (após F4);
- integridade do fluxo de aprovação/execução: `prepared → approved → executing →
  executed`, claim atômico, idempotência e rollback transacional com auditoria
  (após F1–F3);
- 286 testes verdes e `tsc --noEmit` limpo.

Critérios que faltam para liberar a ativação:

1. Executar a suíte e os cenários de concorrência **em PostgreSQL real** (seção 8).
2. Confirmar no painel do Render que `FILTRA_DOT_FORCE_ON` e o worker permanecem
   desligados e que `FILTRA_DOT_ENABLED` segue ausente até a decisão de liberar.
3. Decidir formalmente sobre segregação de funções (risco 1) ou aceitar por escrito
   o modelo atual para ações internas.
4. Aplicar o provisionamento de proprietário às empresas Rei/Corporativo existentes
   (sem owner a administração nega por padrão — `fail-closed`).

## 13. Evidências reproduzíveis

```bash
git clone https://github.com/LU9DI/backend.git && cd backend
git checkout audit/dot-security-audit
npm ci
npm rebuild sqlite3 --build-from-source     # necessário só neste ambiente (glibc 2.36)
npm test                                     # 286 testes, 286 pass
npm run build                                # tsc --noEmit
npm audit --omit=dev                         # 3 moderadas (qs via express, @hono/node-server)
node --import tsx --test tests/dotActionAuditIntegrity.test.ts
node --import tsx --test tests/dotRouteProtection.test.ts
```

Logs desta execução: `/tmp/backend-baseline2.log` (baseline 280/280),
`/tmp/backend-final-tests.log` (286/286), `/tmp/backend-build.log` (`BUILD_EXIT=0`),
`/tmp/backend-audit.log` (`npm audit`).

### Conformidade com as regras do pedido

| Regra | Cumprimento |
| --- | --- |
| Não alterar variáveis do Render / serviços | ✅ nenhum acesso ou alteração |
| Não habilitar `FILTRA_DOT_ENABLED` / `FILTRA_DOT_FORCE_ON` | ✅ nenhuma variável definida; `FORCE_ON` continua exigindo `FILTRA_DOT_ENABLED=1` no código |
| Não habilitar worker em produção | ✅ `DOT_AGENT_WORKER_ENABLED` não foi definida |
| Não rodar migração destrutiva | ✅ apenas `CREATE TABLE IF NOT EXISTS` já existentes em testes |
| Não modificar secrets | ✅ nenhum |
| Não usar dados reais | ✅ apenas UUIDs fictícios e dados sintéticos |
| Não fazer deploy/merge | ✅ apenas branch + PR |
| Não sobrescrever trabalho | ✅ branch própria; `master` intacta |
| Não inventar resultados | ✅ todos os números vêm dos logs citados |

