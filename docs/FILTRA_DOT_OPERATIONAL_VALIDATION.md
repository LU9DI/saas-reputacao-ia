# FILTRA DOT — Validação operacional PostgreSQL

**Data da execução:** 2026-11-02
**Ambiente:** checkout Linux (`/workspace`), repositório `LU9DI/saas-reputacao-ia`
**Branch da execução:** `cline/ae79k7nx` (criada a partir de `main`)
**HEAD no início:** `4e6439ea8f7d3da734f3fe0a1664768b44d04a3d` (`main`)
**Cluster de teste:** PostgreSQL 17.11 descartável em `127.0.0.1:55432`, banco `filtra_dot_test`,
diretório de dados `/tmp/filtra-dot-pg-validation/data`

**Classificação final:** `VALIDAÇÃO REPROVADA` para o escopo solicitado.
Justificativa na seção 9: os 12 cenários implementados foram executados contra PostgreSQL real e
passaram (12/12, 0 ignorados, 0 falhas), **mas** dois cenários exigidos — lockout de PIN e expiração
de sessão — não existem nesta revisão do código e, portanto, não puderam ser executados.

---

## 1. Divergência de premissa (registrada antes de qualquer alteração)

O pedido descreve uma execução em outra cópia de trabalho. Fatos verificados neste repositório:

| Item informado no pedido | Estado real neste checkout |
| --- | --- |
| `C:\Users\lucas\work\saas-dot` | `/workspace` (clone de `LU9DI/saas-reputacao-ia`) |
| Branch `fix/dot-autorizacao-aprovacao` | Não existe (local nem em `origin`) |
| HEAD `88305729e6…310ce` | Existe, mas é `perf(indice): reduzir alocação de memória na geração do sitemap (#159)` — não é commit do Dot |
| `docs/FILTRA_DOT_OPERATIONAL_VALIDATION.md` | Não existia (este documento o cria) |
| `docs/FILTRA_DOT_FINAL_AUDIT.md` | Não existe neste repositório |
| `backend/tests/postgres.dot.integration.test.ts` | Não existia (criado nesta execução) |
| 35 arquivos modificados + 49 não rastreados | `git status --porcelain` estava vazio (árvore limpa em `main`) |
| PostgreSQL instalado em `C:\Program Files\PostgreSQL\17` e `18` | Não há instalação de PostgreSQL neste ambiente (`/usr/lib/postgresql`, `/var/lib/postgresql` e `psql` inexistentes) |

Nenhum `git reset`, `git clean`, checkout destrutivo ou restauração em massa foi executado.
Nenhum commit foi feito em `main`; todo o trabalho está na branch `cline/ae79k7nx`.

## 2. O que foi implementado

### 2.1 Harness real: `backend/tests/postgres.dot.integration.test.ts`

Doze cenários, todos contra PostgreSQL real (sem mock, sem SQLite, sem enfraquecimento de asserções):

| # | Cenário | O que prova |
| --- | --- | --- |
| 1 | Identidade do banco | `current_database()`, `inet_server_port()`, `inet_server_addr()` e `data_directory` batem com a URL de teste; porta ≠ 5432 |
| 2 | Isolamento entre tenants — aprovação | Tenant A não aprova ação do tenant B (retorna `null`, sem transição, sem auditoria); o tenant dono aprova |
| 3 | Isolamento entre tenants — execução | Tenant A não executa ação do tenant B (`ok: false`), sem `execution_started`, sem caso interno |
| 4 | Isolamento entre tenants — leitura | `listDotActions`/`listDotPermissions` vazios para A; `dotAccessAllowed` nega A mesmo com `user_id` conhecido do tenant B |
| 5 | Ação cancelada | `approveDotAction` → `null`; `executeDotAction` → rejeitado; status permanece `cancelled`; auditoria inalterada |
| 6 | Concorrência no banco (SQL puro) | Duas conexões independentes com transações próprias: a segunda fica **bloqueada** no lock de linha e termina com `rowCount = 0`; só uma reivindica a ação |
| 7 | Concorrência entre processos — aprovação | Dois processos Node independentes (pools e memória próprios, barreira temporal comum) disputam a mesma ação: exatamente 1 vence, 1 `approved` na auditoria, decisão promovida uma única vez |
| 8 | Concorrência entre processos — execução | Idem para execução: exatamente 1 `ok: true`, 1 `execution_started`, 1 `executed`, 1 caso interno |
| 9 | Rollback | Falha no meio de `withDbTransaction` reverte a transição (`status` volta a `prepared`, `approved_at` nulo, sem auditoria) |
| 10 | Auditoria e contagem de transições | Fluxo prepare → approve → execute gera exatamente `prepared`, `approved`, `execution_started`, `executed` (1 de cada, na ordem), 1 autorização de acesso e 1 follow-up |
| 11 | Preparação duplicada | Duas preparações concorrentes da mesma decisão convergem para o mesmo `action_id`; o índice único parcial impede duas ações ativas |
| 12 | Migrações repetidas | `ensureDotSchema()` três vezes: mesmo conjunto de tabelas, mesmas contagens de linhas |

### 2.2 Worker de concorrência: `backend/tests/support/dotConcurrencyWorker.ts`

Processo separado que chama `approveDotAction`/`executeDotAction` com pool e estado em memória
próprios, disparando em uma barreira temporal (`startAt`) comum aos dois processos. É isso que
impede o mutex em memória de `dotActionQueue.ts` (`withActionLock`) de mascarar a ausência de
proteção no banco: cada processo tem seu próprio `Map` de locks.

### 2.3 Automação do cluster descartável: `backend/scripts/run-dot-pg-validation.sh`

Provisiona o cluster em diretório temporário, aborta se o diretório de dados já tiver conteúdo,
sobe apenas em `127.0.0.1` com porta dedicada, cria somente `filtra_dot_test`, confere a identidade
via SQL, executa a suíte e para o servidor no `trap EXIT` preservando dados e logs.

## 3. Cluster descartável: criação e verificação

```bash
# binários PostgreSQL 17.11 (distribuição empacotada, sem root):
#   /tmp/pg-tools/node_modules/@embedded-postgres/linux-x64/native/bin
initdb -D /tmp/filtra-dot-pg-validation/data -U postgres --auth=trust --encoding=UTF8 --locale=C
pg_ctl -D /tmp/filtra-dot-pg-validation/data \
       -l /tmp/filtra-dot-pg-validation/postgres.log \
       -o "-p 55432 -c listen_addresses=127.0.0.1" start
```

Verificações executadas (todas aprovadas):

| Verificação | Resultado observado |
| --- | --- |
| Versão | `PostgreSQL 17.11 on x86_64-pc-linux-gnu` |
| `listen_addresses` | `127.0.0.1` (somente loopback) |
| Porta | `55432` |
| Host da conexão | `127.0.0.1/32` |
| `current_database()` | `filtra_dot_test` |
| `data_directory` | `/tmp/filtra-dot-pg-validation/data` (diretório exclusivo desta validação) |
| Banco criado | apenas `filtra_dot_test` |
| Diretório de dados preexistente | inexistente antes do `initdb` (nada foi apagado) |

Observação de ambiente: a distribuição PostgreSQL usada não inclui `psql` nem `pg_isready`.
A verificação funcional equivalente foi feita por conexão TCP em loopback + consultas de identidade
acima, e o próprio harness revalida a identidade no cenário 1.

## 4. Comandos efetivamente executados

```bash
export DOT_PG_TEST_DATABASE_URL="postgresql://postgres@127.0.0.1:55432/filtra_dot_test"
export NODE_ENV=test
cd backend
npx tsx --test tests/postgres.dot.integration.test.ts
```

## 5. Resultado real (execução autoritativa)

Log completo: `/tmp/dot-pg-final.log`

```
[dot-pg] identidade do banco: {"database":"filtra_dot_test","port":55432,"host":"127.0.0.1/32",
                               "data_directory":"/tmp/filtra-dot-pg-validation/data"}
✔ 1. banco em uso é a instância descartável dedicada (loopback, porta dedicada)
✔ 2. isolamento entre tenants: tenant A não aprova ação do tenant B
✔ 3. isolamento entre tenants: tenant A não executa ação do tenant B
✔ 4. isolamento entre tenants: listagem e permissões não vazam entre tenants
✔ 5. ação cancelada não pode ser aprovada nem executada
✔ 6. concorrência no banco: apenas uma transação reivindica a mesma ação
✔ 7. concorrência entre processos: apenas um processo aprova a mesma ação
✔ 8. concorrência entre processos: apenas um processo executa a mesma ação
✔ 9. rollback: falha no meio da transação não deixa transição parcial
✔ 10. auditoria: fluxo prepare → approve → execute registra uma transição por etapa
✔ 11. preparação duplicada não cria duas ações ativas para a mesma decisão
✔ 12. migrações repetidas são seguras e idempotentes

tests 12 | pass 12 | fail 0 | cancelled 0 | skipped 0 | duration_ms 7010
```

| Métrica | Valor |
| --- | --- |
| Total | 12 |
| Aprovados | 12 |
| Falhos | 0 |
| Ignorados | 0 |
| Duração | 7.010 s |

### 5.1 Repetição (confirma reprodutibilidade)

Uma segunda execução, no mesmo cluster já encerrado e reiniciado (`/tmp/dot-pg-final2.log`),
repetiu o resultado: **12 testes, 12 aprovados, 0 falhos, 0 cancelados, 0 ignorados, 7.020 s**.
Isso confirma que a suíte é reexecutável sobre um banco não vazio (o `before` trunca apenas as
tabelas `dot_*` e recria os tenants sintéticos `pg-it-*`).

## 6. Suíte completa do backend (não regressão)

`npm test` com `DOT_PG_TEST_DATABASE_URL` definida — log em `/tmp/dot-full-suite.log`:

- 178 testes, 163 aprovados, 0 falhos, **15 cancelados**, 0 ignorados.
- Os 12 cenários deste harness rodaram dentro da suíte completa e passaram.
- Os 15 cancelamentos são **preexistentes e alheios** a esta mudança: 5 arquivos de integração
  (`integration.stripe-webhook`, `integration.reviews`, `integration.lead-legal`, `integration.api.smoke`,
  `empresaRoutesOperational`) apagam `DATABASE_URL` e dependem das dependências opcionais
  `sqlite`/`sqlite3`, que não estão instaladas neste ambiente
  (`Error: SQLite não instalado. Use DATABASE_URL=postgresql://... ou npm i -D sqlite sqlite3`).
  A árvore só continha os dois arquivos novos desta execução, então esses cancelamentos não vêm dela.

Sem `DOT_PG_TEST_DATABASE_URL` a suíte é ignorada (`# SKIP`) para não quebrar CI sem banco;
na execução operacional a variável é obrigatória e a contagem de ignorados foi 0.

## 7. Falhas encontradas durante a execução e correções

| Falha | Causa | Correção |
| --- | --- | --- |
| `Banco ainda não inicializado. Chame initDB() primeiro.` | `before` usava `getDb()` sem `initDB()` | passou a usar `await libDb.initDB()` |
| Script de automação: `column "data_directory" does not exist` | aninhamento de aspas do shell em `current_setting('data_directory')` | SQL de identidade movido para `DOT_PG_IDENTITY_SQL`; passou a usar `pg_settings` |
| Cenário 1 falhava em porta alternativa (`55433 !== 55432`) | porta fixa no teste | identidade derivada da URL, mantendo as garantias (loopback, banco, porta ≠ 5432) |

Nenhuma asserção foi enfraquecida e nenhum teste foi substituído por mock para obter verde.


## 8. Estado após o encerramento

| Item | Estado |
| --- | --- |
| Servidor temporário | **parado** (`pg_ctl … stop -m fast`; nenhum processo `postgres -D` ativo) |
| Diretório de dados | preservado: `/tmp/filtra-dot-pg-validation/data` (48 MB) |
| Log do cluster | preservado: `/tmp/filtra-dot-pg-validation/postgres.log` (36 KB) |
| Cluster temporário apagado | **não** (preservado para inspeção, conforme instrução) |
| Clusters PostgreSQL 17/18 instalados | não existem neste ambiente; nada foi parado ou alterado |
| `FILTRA_DOT_ENABLED` | **não definida** |
| `FILTRA_DOT_SCHEDULER_ENABLED` | **não definida** |
| Efeitos externos | nenhum (todo o fluxo é interno; `externalSideEffect: false` no registry) |

## 9. Cenários exigidos que não puderam ser executados

| Cenário exigido | Situação | Evidência |
| --- | --- | --- |
| Lockout do PIN (5 tentativas inválidas → `locked_until`) | **Pendente — funcionalidade inexistente** | `grep -niE '\bpin\b\|pin_hash\|locked_until\|lockout'` em `backend/services/dot*`, `backend/routes/dot*` e `backend/lib/auth.ts` não retorna nada. Não há hash de PIN, contador de tentativas nem coluna de bloqueio para criar o teste |
| Expiração de sessão administrativa | **Pendente — funcionalidade inexistente** | Não há sessão de servidor para o Dot. `backend/routes/dotRoutes.ts` mantém apenas histórico de chat em memória (`Map` de `ChatItem`, chaveado por tenant/usuário/sessão) sem `expires_at`. A autenticação é por JWT (`verifyAccessToken`), cuja expiração não é uma sessão persistida |

Ambos ficam registrados como **pendentes**, e não como aprovados: pela regra do pedido
(“não classificar como aprovada se houver teste crítico pendente”), a classificação é
`VALIDAÇÃO REPROVADA` para o escopo solicitado, ainda que todos os cenários executáveis tenham
passado. Resolver esses dois pontos exige implementar PIN + lockout e sessão server-side com
expiração — mudança arquitetural que não foi feita por não haver implementação prévia a validar.

## 10. Cobertura entregue frente aos seis pontos pedidos

| Ponto pedido | Estado |
| --- | --- |
| 1. Isolamento entre tenants (aprovar/consultar/executar) | ✅ cenários 2, 3, 4 |
| 2. Lockout do PIN | ⛔ pendente (feature ausente) |
| 3. Expiração de sessão | ⛔ pendente (feature ausente) |
| 4. Ação cancelada | ✅ cenário 5 |
| 5. Concorrência real no PostgreSQL, sem mutex/mocks | ✅ cenários 6, 7, 8 |
| 6. Transições e registros de auditoria | ✅ cenários 10, 11 (+ verificação em 6, 7, 8, 9) |

Extras cobertos: rollback transacional (9) e migrações repetidas (12).

## 11. Risco F3 e decisões operacionais

Ver `docs/FILTRA_DOT_OPERATIONAL_VALIDATION_ADDENDUM.md`. O documento
`docs/FILTRA_DOT_FINAL_AUDIT.md` citado no pedido não existe nesta revisão; a definição de F3 foi
derivada da leitura do código e está registrada no adendo.

## 12. Estado final do Git

```
branch: cline/ae79k7nx
HEAD:   test(dot): harness PostgreSQL real para autorização, isolamento e concorrência
main:   4e6439ea8f7d3da734f3fe0a1664768b44d04a3d (intacta)
```

Arquivos desta execução: `backend/tests/postgres.dot.integration.test.ts`,
`backend/tests/support/dotConcurrencyWorker.ts`, `backend/scripts/run-dot-pg-validation.sh`,
este documento e o adendo. Nenhum push para `main`, nenhum merge, nenhum deploy.

