# Render: deploy, health check e horas gratuitas

**Data:** 2026-11-04
**Natureza:** documento operacional. Nada aqui foi aplicado no painel — este ambiente não tem credencial, CLI nem MCP do Render. Cada item separa o que foi **verificado por HTTP/README** do que **depende do painel**.

---

## 1. Topologia confirmada por HTTP

| Serviço | Host | Evidência |
|---|---|---|
| API | `https://filtra-ia-api.onrender.com` | `/api/live` → 200, `build.version = 1.4.0`, `marker = reviews-unidade-v1` |
| Índice | `https://filtra-indice.onrender.com` | `/indice` → 200 com `x-indice-proxy`/`render-origin` |
| Runtime/Web do site | atrás do Worker Cloudflare (`filtraai.com`) | `/` → 200; `/api/*` roteado para a API por `infra/cloudflare/worker.js` |

O `render.yaml` do monorepo declara um serviço `filtra-api` com `healthCheckPath: /api/health`, mas **esse blueprint não é o que está no ar**: a API em produção vem do repositório `LU9DI/backend` (commit `a2e3f6b`, PR #143). Alterar `render.yaml` aqui não muda o serviço em produção.

## 2. Health check da API (item C)

### Situação

`/api/live` responde 200 e não toca no banco. `/api/ready` responde 200 mas faz ping no Postgres — medido em **7,2 s** a frio. `/api/health` também consulta o banco.

### Recomendação: `/api/live`

| Endpoint | Toca o banco? | Tempo a frio | Serve como health check? |
|---|---|---|---|
| `/api/live` | não | ~0,3–3 s (cold start) | **sim** |
| `/api/ready` | sim (ping) | 7,2 s | **não** — estoura o timeout de 5 s do Render |
| `/api/health` | sim | 0,7–7 s | não recomendado pelo mesmo motivo |

Fatos do Render que sustentam a escolha:

- Health check HTTP tem **timeout de 5 s** e considera saudável **2xx–3xx**.
- Falhas por **60 s** fazem o Render reiniciar a instância.
- **O probe do Render vai direto na instância, não passa pelo Cloudflare** — o cache de borda (`CF-Cache-Status: HIT`, `Age: 1813` observados em `/api/live` via `filtraai.com`) não interfere no health check.

Um endpoint que depende do Postgres como health check transforma indisponibilidade do banco em **restart loop** da API — exatamente o que se quer evitar num plano Free.

### Observação: não usar o domínio público para sonda externa

`https://filtraai.com/api/live` respondeu com `CF-Cache-Status: HIT` e `Age: 1813`, ou seja, **o Cloudflare serve uma cópia em cache de borda** desse caminho (o Worker não cacheia `/api/*`; o cache vem da camada de zona). Consequências:

- o probe do Render **não é afetado**, porque ele fala direto com a instância;
- monitor externo (UptimeRobot, cron, GitHub Action) **não deve** usar `filtraai.com/api/live`: ele pode receber 200 antigo com a origem fora do ar;
- para sonda externa, usar `https://filtra-ia-api.onrender.com/api/live`.

### Procedimento no painel (API)

1. `https://dashboard.render.com` → serviço da API (`filtra-ia-api`) → **Settings**.
2. Localizar **Health Check Path** (seção *Health Checks*).
3. Preencher `/api/live` e salvar.
4. Confirmar na aba **Events** que não houve reinício em cascata nos 10 min seguintes.
5. Confirmar em **Logs** que o probe chega em `/api/live` com 200.

**Não configurar `/api/live` no serviço do Runtime nem no Índice**: `/api/*` é rota da API. No Índice, o health check TCP padrão já é adequado; se quiserem HTTP, o caminho barato é `/indice/metodologia` (estático), não `/api/live`.

## 3. Velocidade dos deploys (item B)

### O que foi medido

| Medição | Valor | Onde |
|---|---|---|
| `npm ci` a frio no Índice | ~180 s | Windows, Node 26, rede local |
| `npm run build` do Índice — primeira vez (`.next` ausente) | **318 s** | idem |
| `npm run build` do Índice — seguintes (`.next` presente) | **115 s** | idem |
| Deploy no Render (relatado: API 45 s, Web 54 s, Runtime 77 s, Índice 77 s) | 45–77 s | painel |

Leitura: **um deploy completo do Índice em 77 s é mais rápido do que um único build local a frio (318 s)**. Isso indica que o Render **já está reutilizando cache de build** (ou tem CPU bem mais rápida). Um serviço que reinstalasse tudo do zero a cada deploy não fecharia em 77 s com um build de Next desse tamanho.

### Sobre `cache.profile: no-cache`

- A especificação de blueprint do Render **não tem campo de cache** para runtimes nativos (`node`, `python`, …). O único `cache` documentado na spec é o nome de um serviço Key Value de exemplo.
- `cache.profile` é um campo no formato do **Railway**, não do Render.
- No Render, o cache de build é **padrão**; o que existe é a ação manual **"Clear build cache & deploy"**, usada justamente para *limpar* o cache.

Conclusão: `cache.profile: no-cache` provavelmente vem de uma configuração legada (Railway) que **não tem efeito** no Render. Não é necessário "habilitar" cache de build; é necessário **não limpá-lo**.

### Procedimento no painel (todos os serviços)

1. Serviço → **Deploys**: conferir se o último deploy foi **"Deploy latest commit"** e não **"Clear build cache & deploy"**.
2. Serviço → **Settings → Build & Deploy**: conferir os comandos.
   - Índice: `npm ci && npm run build` (ou `npm install`), start `npm start`, root `indice`.
   - API: build `npm install` (o `tsc --noEmit` do `LU9DI/backend` só faz typecheck e não é necessário para subir, que usa `tsx`), start `npm start`.
3. Só usar **"Clear build cache & deploy"** quando mudarem dependências nativas, `package-lock.json` corrompido ou suspeita de artefato velho.

### O que já foi descartado por leitura de código

| Suspeita | Resultado |
|---|---|
| Etapas duplicadas no build do frontend | Os pós-build (`fix-static-html-lang`, `validate-html-language`, `audit-meta-descriptions`, `copy-llms-assets`, `generate-markdown-twins`) são **no-op** no Render, porque só rodam com `CLOUDFLARE_PAGES=1` ou `out/` presente. |
| Build do Índice com trabalho extra | `npm run build` = `node scripts/check-data.mjs && next build`. O check é I/O leve, não explica os minutos. `next build` domina. |
| Duplicação de dependências | Monorepo tem `package.json` raiz, `backend/`, `frontend/` e `indice/` — cada serviço instala só o seu diretório (rootDir). Não há reinstalação cruzada. |

Ganho realista: com o cache funcionando, o tempo de deploy é dominado pelo build do Next e pela instalação. **Não há ajuste de configuração que corte os 77 s do Índice pela metade**; o que existe de acionável é (a) não limpar cache, (b) enxugar dependências/build quando houver mudança de código, (c) aceitar que deploys de monorepo grande são lentos.

## 4. Horas gratuitas e consumo (item D)

### Fatos do plano Free

- **750 horas de instância por workspace/mês**, somando **todos** os serviços de runtime.
- Serviços Free **hibernam após 15 min sem tráfego**; hibernado não consome horas.
- Mês com serviço sempre acordado ≈ **730 h** ⇒ **um único serviço 24/7 já consome praticamente a cota inteira**.
- Com **quatro** serviços sempre acordados, a cota se esgota em ~**187 h** (~7,8 dias) de mês.

### Como ler o consumo real

1. `https://dashboard.render.com/billing#included-usage` — mostra horas de instância consumidas no ciclo e a cota.
2. `https://dashboard.render.com` — lista de serviços e plano de cada um. Procurar serviços antigos ativos.
3. Em cada serviço → **Metrics** → *Active instances* / *Memory*: instância acordada aparece com uso contínuo; hibernada fica em zero e volta com cold start.

### Suspeita concreta a verificar

`docs/SETUP_EVOLUTION_N8N.md` referencia `https://n8n-reputacao-ia.onrender.com/webhook/filtra-relatorio-v3`. Se esse serviço ainda existir e estiver acordado, ele consome horas **e** é dependência de workflow do n8n — não pode ser suspenso nem removido sem confirmar que nenhum fluxo usa a URL. Verificar em: `dashboard.render.com` → serviço `n8n-reputacao-ia` → **Metrics** (tem tráfego? tem horas no ciclo?) e **Settings → Suspend**.

### Evidência de que a API está hibernando (não reiniciando)

Duas leituras de `/api/live` no origin, com 27 min de intervalo:

| Leitura | Latência | `build.started_at` |
|---|---|---|
| 1 | — | `2026-11-05T00:29:24Z` |
| 2 | 0,7 s | `2026-11-05T01:00:32Z` |
| 3 | **33,6 s** (cold start) | `2026-11-05T01:27:58Z` — igual ao instante da requisição |

O padrão é **spin-down após 15 min ocioso + cold start**, não restart loop: o processo nasce no momento em que a requisição chega. Isso é bom para a cota (hibernado não consome horas) e ruim para latência (33 s no primeiro acesso depois do repouso).

Consequência prática: se as horas do workspace estiverem estourando, a causa **não** é a API reiniciando, e sim algum serviço que fica acordado — seja por tráfego real, seja por ping periódico.

### Regra prática sem custo

- Manter acordado 24/7 só o que precisa de resposta imediata (API e site). Índice e backoffice podem hibernar.
- **Não** criar keepalive/ping periódico: já existe `.github/workflows/indice-keepalive.yml`, e ele é **manual apenas** justamente porque keepalive frequente queima a cota compartilhada.
- Se algum monitor externo (UptimeRobot, cron, ping de SEO) estiver batendo nos serviços, ele anula a hibernação — verificar antes de concluir que "as horas sumiram".

## 5. Supabase — efeito da otimização de bootstrap (item E)

### Verificado em código

O commit `a2e3f6b` (PR #143, repositório `LU9DI/backend`) faz cache do bootstrap de schema por conexão (WeakMap) em `lib/retryQueue.ts` e `lib/acquisitionEngine.ts`, e isola erros transitórios em `services/dotAgentWorker.ts`:

```
lib/acquisitionEngine.ts             | 22 +++++++-
lib/retryQueue.ts                    | 70 +++++++++++++++-----------
services/dotAgentWorker.ts           | 14 +++++-
tests/workerSchemaBootstrap.test.ts  | 73 ++++++++++++++++++++++
```

O `/api/ready` em produção confirma `db.engine = postgres` e `build.marker = reviews-unidade-v1`, ou seja, **a versão com a otimização é a que está no ar**.

### Não verificável daqui

Sem credencial do Supabase não é possível confirmar conexões, timeouts e frequência de DDL. Consultas para rodar no SQL Editor do Supabase:

```sql
-- DDL repetido ainda acontecendo?
select query, calls, mean_exec_time
from pg_stat_statements
where query ilike '%create table if not exists%'
order by calls desc
limit 20;

-- conexões por estado
select state, count(*)
from pg_stat_activity
group by state
order by 2 desc;
```

Se `pg_stat_statements` não estiver habilitado, usar **Logs → Postgres Logs** no painel do Supabase e filtrar por `CREATE TABLE`.

### Risco residual identificado no código

O cache do bootstrap cobre `retry_queue` e `acquisition_sends`, mas **há chamadas de `ensure*Schema` fora do caminho cacheado**:

- `routes/acquisitionRoutes.ts`: `ensureAcquisitionSchema` em caminho de request;
- `ensureOpsTables`, `ensureAiUsageSchema`, `ensurePlanPricingSchema`, `ensureUnidadesSchema`, `ensureAuditSchema`, `ensurePushSchema`: chamadas repetidas em `lib/` e `server.ts`.

Cada uma é `CREATE TABLE IF NOT EXISTS`, que no Postgres ainda toma lock e gera round-trip. Não é o "centenas de DDL por minuto" do incidente anterior, mas é desperdício. Corrigir exige o mesmo padrão de WeakMap por conexão — **não foi feito nesta rodada** porque o efeito não é observável sem acesso ao banco, e a regra do projeto é "não alterar sem evidência".

## 6. Resumo do que depende de painel

| Item | Ação | Onde |
|---|---|---|
| Health check da API | preencher `/api/live` | Render → serviço da API → Settings → Health Check Path |
| Cache de build | confirmar que os deploys são "Deploy latest commit" | Render → cada serviço → Deploys |
| Horas gratuitas | ler consumo do ciclo | `dashboard.render.com/billing#included-usage` |
| Serviços antigos | listar e checar tráfego/horas | `dashboard.render.com` |
| Supabase | contar DDL e conexões | Supabase → SQL Editor / Logs → Postgres |
| Memória do Índice pós-deploy | comparar faixa de 487–507 MB | Render → Índice → Metrics → Memory |
