# PR #139 — Integridade das migrações PostgreSQL

> Branch de trabalho: `cline/rf9q7dty` (backup/entrega do mesmo conteúdo que seria
> aplicado em `fix/dot-audit-integrity-postgres`). Base: `main`.
> Sem merge, sem deploy, sem alteração de Render/Supabase/variáveis de produção.

## 1. Branch e HEAD

| Momento | Branch | HEAD |
|---|---|---|
| Antes | `main` | `4e6439ea8f7d3da734f3fe0a1664768b44d04a3d` |
| Após implementação (código + testes) | `cline/rf9q7dty` | `50ec2694` |
| Após correção final de `closeDB` + este relatório | `cline/rf9q7dty` | commit seguinte a este arquivo |

`git diff --check`: sem saídas. `git diff --stat` (código):

```
 backend/lib/db.pg.ts                       | 200 ++++++++++++++++++----------
 backend/lib/db.ts                          |  90 +------
 backend/lib/migrations.ts                  | 344 ++++++++++++++++++++++++++++++
 backend/mfa.ts                             |  20 +-
 backend/package.json                       |   1 +
 backend/passwordResetRoutes.ts             |  40 +--
 backend/services/dotActionAudit.ts         |  36 +--
 backend/services/dotActionQueue.ts         |  57 +++-
 testes novos (6 arquivos)                   | ~1.200 linhas
```

Nenhum arquivo de configuração de produção foi tocado (Render, Supabase, `.env`,
`docker-compose`, `render.yaml`, workflows).

## 2. Arquivos alterados e problema corrigido

### `backend/lib/db.pg.ts`

**Problema:** `let pool: pg.Pool | null = null;` era global e mutável. Dois bancos
inicializados no mesmo processo compartilhavam/sobrescreviam o pool; `close()` de
um encerrava o outro; `initPgDatabase` de outro banco reapontava conexões da
instância existente. Além disso, `exec` engolia `42P07`, `42701` e qualquer
mensagem `already exists`, mascarando erros reais de DDL.

**Correção:**
- Pool criado como constante local dentro de `initPgDatabase`; `exec`, `run`,
  `get`, `all`, `transaction` e `close` usam apenas esse pool.
- `transaction` reserva um único `PoolClient` entre `BEGIN`, operações,
  `COMMIT` e `ROLLBACK`; falha de `ROLLBACK` é logada e nunca substitui o erro
  original.
- `close()` encerra somente o pool da instância (sem `pool = null` global).
- Novo `withMigrationLock(lockKey, work)` que reserva uma conexão dedicada,
  adquire `pg_advisory_lock`, executa a sequência, libera em `finally` e trata
  falha de aquisição/perda de conexão como erro fatal.
- `exec` não tolera mais códigos de catálogo/unicidade: todo erro inesperado é
  logado (SQL truncado) e propagado.

### `backend/lib/migrations.ts` (novo)

**Problema:** DDL espalhada por caminhos de requisição, sem ordem, sem lock e
sem verificação de schema; corridas de `CREATE TABLE`/`ALTER TABLE` na CI.

**Correção:** inicialização central idempotente (`runCentralMigrations`) com
introspecção portátil (`PRAGMA table_info` no SQLite; `information_schema` via
`PRAGMA` traduzido e `pg_indexes` no PostgreSQL) cobrindo:
`reviews.createdAt`, `reviews.is_test`, `usuarios.email`, os quatro campos MFA,
`password_resets`, `dot_action_queue`, `dot_action_audit` (incluindo
`metadata`) e todos os índices (`idx_*`, `ux_dot_action_queue_*`).
Também expõe `requireSchema` (verificação sem DDL) e
`PG_MIGRATION_LOCK_KEY`.

### `backend/lib/db.ts`

Remove toda DDL inline e as chamadas `ensureAuthColumns`/`ensureMfaColumns` do
boot; passa a chamar `runCentralMigrations(_db)` sob lock. Adiciona `closeDB()`
para encerrar a instância ativa (usado pelos testes).

### `backend/passwordResetRoutes.ts` e `backend/mfa.ts`

`ensureAuthColumns()` e `ensureMfaColumns()` deixaram de executar
`ALTER TABLE`/`CREATE TABLE`/`CREATE INDEX`. Agora só verificam o schema e
lançam erro explícito (com log) se algo obrigatório estiver ausente. Recuperação
de senha, criação de usuário e autenticação MFA não migram schema.

### `backend/services/dotActionAudit.ts` e `backend/services/dotActionQueue.ts`

`ensureDotActionAuditSchema()` e `ensureSchema()` não executam DDL em
registro/consulta de auditoria nem em preparar/aprovar/listar/executar ações —
apenas verificam tabela, colunas e índices obrigatórios. A preparação também só
registra o evento `prepared` na chamada que realmente inseriu a ação, evitando
duplicidade de auditoria entre processos.

### `backend/package.json`

- `test` passa a excluir `*.pg.test.ts` (mantém a suíte padrão sem banco).
- Novo `test:postgres` executa apenas os testes PostgreSQL reais.

## 3. Estratégia de lock e isolamento de pools

- Chave estável documentada:
  `PG_MIGRATION_LOCK_KEY = 8005998760133593297n`
  (FNV-1a 64 bits de `filtra-ia:postgres:migrations:v1`, truncada para 63 bits
  para caber em `pg_advisory_lock(bigint)`).
- O lock é **de sessão** e é adquirido em uma conexão dedicada (fora do pool
  rotativo), mantida reservada durante toda a sequência de migrações e liberada
  com `pg_advisory_unlock` no `finally`. Funciona entre processos e instâncias.
- Falha ao adquirir o lock, perda da conexão dedicada durante as migrações e
  falha de unlock são erros fatais de inicialização (`initDB()` rejeita).
- O lock não é usado por chamada de `exec`; envolve a sequência completa.
- Cada `PgDatabase` tem seu próprio `pg.Pool`; `close()` encerra só o próprio
  pool. SQLite mantém o comportamento original (sem lock, mesma API).

## 4. Testes e resultados

Ambiente de execução real: PostgreSQL **16.15** descartável (instância local
isolada, banco criado/derrubado por teste).

### `npm run build`

```
> backend@1.0.4 build
> node -e "console.log('Filtra.IA build ok')"
Filtra.IA build ok
```

`npx tsc --noEmit -p tsconfig.json`: **0 erros**.

### `npm test` (suíte padrão, SQLite)

```
ℹ tests 171
ℹ suites 38
ℹ pass 171
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
```

### `npm run test:postgres`

```
✔ três processos inicializam um banco PostgreSQL vazio simultaneamente sem erro de DDL
✔ falha deliberada de migração é propagada e o advisory lock é liberado
✔ fechar uma instância PostgreSQL não encerra a outra
✔ exec propaga erros inesperados de catálogo em vez de mascará-los
✔ duas instâncias PostgreSQL preparam a mesma ação sem auditoria duplicada
✔ duas instâncias PostgreSQL não aprovam duas vezes a mesma ação
ℹ tests 6
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

### Inicialização concorrente — logs completos

```
PostgreSQL real em uso: 16.15
worker 1: exit=0 stdout={"pid":5195,"engine":"postgres","serverVersion":"16.15","reviewsColumns":["id","empresa_id","name","rating","comment","ai_reply","ai_tags","createdat","is_test"],"usuariosColumns":["id","cnpj","nome_funcionario","empresa_id","senha_hash","email","mfa_secret","mfa_enabled","mfa_backup_hashes","mfa_pending_secret"],"auditColumns":["id","empresa_id","action_id","decision_id","event","actor_type","actor_id","metadata","created_at"],"indexes":{"idx_reviews_empresa":true,"idx_empresas_cnpj":true,"idx_empresas_slug":true,"idx_usuarios_email":true,"idx_password_resets_usuario":true,"ux_dot_action_queue_decision_option":true,"ux_dot_action_queue_one_active_decision":true,"idx_dot_action_audit_empresa":true,"idx_dot_action_audit_action":true}} stderr=🐘 Postgres conectado (DATABASE_URL)
Schema inicializado (migrações centrais idempotentes)
worker 2: exit=0 stdout={"pid":5196,...} stderr=🐘 Postgres conectado (DATABASE_URL)
Schema inicializado (migrações centrais idempotentes)
worker 3: exit=0 stdout={"pid":5197,...} stderr=🐘 Postgres conectado (DATABASE_URL)
Schema inicializado (migrações centrais idempotentes)
idempotência comprovada: schema idêntico após segunda inicialização
```

Os três processos têm PIDs distintos, pools próprios, terminam com código 0 e
**stderr sem nenhum padrão de erro DDL** (`already exists`, `42P07`, `42701`,
`23505`, `duplicate column`, `pg.exec falhou`). O teste valida tabelas, colunas e
os 9 índices e compara o snapshot do schema antes/depois de uma segunda
inicialização.

### Evidência de propagação de erro

```
pg.exec falhou: cannot create index on relation "reviews" [42809]
SQL: CREATE INDEX IF NOT EXISTS idx_reviews_empresa ON reviews(empresa_id)
ero propagado como esperado: cannot create index on relation "reviews"
```

Depois da falha, o teste confirma com `pg_try_advisory_lock` que o lock foi
liberado no `finally`.

### Evidência de que `exec` não mascara mais erros

```
pg.exec falhou: relation "alvo" already exists [42P07]
pg.exec falhou: column "id" of relation "alvo" already exists [42701]
pg.exec falhou: relation "tabela_inexistente" does not exist [42P01]
pg.exec falhou: syntax error at or near "SELEC" [42601]
```

As quatro chamadas rejeitam (`assert.rejects`). `IF NOT EXISTS` explícito
continua idempotente.

### Idempotência em SQLite (compatibilidade preservada)

```
💾 SQLite: .../sqlite-migration-check.sqlite
Schema inicializado (migrações centrais idempotentes)
💾 SQLite: .../sqlite-migration-check.sqlite
Schema inicializado (migrações centrais idempotentes)
reviews: [..., "createdAt", "is_test"]
usuarios: [..., "email", "mfa_secret", "mfa_enabled", "mfa_backup_hashes", "mfa_pending_secret"]
indexCount: 9
idempotent: true
```

Testes de integração que usam SQLite (`integration.reviews`, `integration.stripe-webhook`):
9/9 passando.

### `npm audit --omit=dev`

```
found 0 vulnerabilities
```

## 5. Confirmações

- Não houve merge.
- Não houve deploy.
- Não houve publicação de URLs, migração de dados ou alteração de Render/Supabase.
- Filtra Dot não foi ativado.
- `main` não foi modificada; histórico não foi reescrito.
- Nenhum teste foi ignorado, cancelado ou marcado como `skip`; todos os testes
  PostgreSQL acima rodaram contra PostgreSQL 16.15 real.
