# DSV4 — Recuperação do Índice e finalização SEO do Filtra.AI

**Execução:** 31/10/2026
**Repositório:** `LU9DI/saas-reputacao-ia` · branch de trabalho `cline/zv5xh6c6` (criada a partir de `main` @ `4a31e3a7`)
**PR:** aberta em rascunho, sem merge — ver §3
**Restrições respeitadas:** nenhum deploy, nenhuma alteração de billing, nenhuma contratação, nenhum merge, nenhum force push, nenhum dado removido, nenhum secret alterado.

---

## 0. Resumo: o que foi executado e o que está bloqueado

| Frente | Estado | Evidência |
|---|---|---|
| Código de SEO corrigido e testado | **FEITO** | §2, §4 |
| Sitemap do Índice materializável sem runtime | **FEITO** (código + artefato gerado e validado) | §2.1 |
| Gate automático de produção | **FEITO** (novo `npm run seo:verify-production`) | §2.4 |
| Deploy em produção | **BLOQUEADO** (proibido nesta tarefa) | §10 |
| Reativação do Render | **BLOQUEADO** (billing; fora de autorização) | §5, §10 |
| Confirmação de indexação no GSC | **BLOQUEADO** (conector indisponível) | §10 |

**Situação da infraestrutura em 31/10/2026 ~20:20 UTC — não recuperada:** o serviço
Render `filtra-indice` continua suspenso (`503 This service has been suspended.`) e
todas as páginas `/indice/*` retornam 503. Isso **não** pôde ser revertido sem
acesso ao painel Render/billing, que esta execução não tem permissão para tocar.
O que foi feito é a remoção da **dependência** desse serviço para o artefato de
sitemap, mais o gate que impede a produção de ser declarada saudável sem prova.

---

## 1. Diagnóstico revalidado antes de agir

Nada foi assumido a partir da auditoria anterior; tudo foi re-medido.

| Verificação | Endpoint | Resultado em 31/10 ~20:20 UTC |
|---|---|---|
| Serviço do Índice | `https://filtra-indice.onrender.com/indice/sitemap-index.xml` | `503` — `This service has been suspended.` |
| Shard 0 | `GET /indice/sitemap/0.xml` | `200` **de cache** (`x-indice-proxy: render-cache`, `cf-cache-status: STALE`) |
| Shard 1 | `GET /indice/sitemap/1.xml` | `429` (desafio Cloudflare, `cf-mitigated: challenge`) |
| Shard 2 | `GET /indice/sitemap/2.xml` | `200` de cache, 8.853 URLs |
| Páginas do Índice | `/indice`, `/indice/metodologia` | `503` |
| Agente do Índice | `/indice/llms.txt`, `/indice/llms-full.txt`, `/indice/md` | `503` |
| Sitemap principal | `GET /sitemap.xml` | `200`, 97 URLs, 0 `lastmod`, 84 alternates `zh`, 0 `x-default` |
| Índice central | `GET /sitemap-index.xml` | `200`, 4 filhos (leaf + 3 shards) |
| `robots.txt` | `GET /robots.txt` | `200`, 3 diretivas `Sitemap:` |
| Chave IndexNow | `/a3d7f1c94b2e6a805d1f7c3b9e4a6d82.txt` | `200` |

**Causa raiz do "erro de 28.600 URLs que desapareceu":** o Worker
`filtra-indice-proxy` passou a devolver XML de cache (`render-cache` /
`render-stale-cache`) quando a origem falha (`infra/cloudflare/filtra-indice-proxy.js:105-161`).
O GSC deixou de ver falha de fetch porque recebe 200 de cache — mas as páginas
continuam 503. Cache **não** é disponibilidade.

**Causa raiz do sitemap principal divergente:** a produção serve um build anterior
a `#106`/`#135`. As três diferenças medidas (97 vs 106 URLs, ausência de
`lastmod`, `zh` em hreflang) são efeito de build antigo — `zh` já era filtrado no
código desde `ee843096` e `lastmod` existe desde `ac555caa`.

---

## 2. Alterações de código realizadas

### 2.1 Sitemap do Índice como artefato estático (novo)

O sitemap do Índice é imutável entre ingestões; servi-lo por um processo Node é o
que transformou uma suspensão de billing em indisponibilidade de 28.853 URLs.

- `indice/scripts/lib/static-sitemaps.mjs` — calcula o **mesmo conjunto de URLs**
  que `src/lib/data.ts: iterarCaminhos()`, com as mesmas regras: base (4), UF,
  município com ao menos uma célula publicada, célula com `ativos >= 10`,
  rankings de aberturas de anos fechados e rankings de ativos (nacional + UF com
  ≥10 municípios). Serializa `urlset`/`sitemapindex` com `lastmod` real, divide
  em shards de 10.000 e valida limites.
- `indice/scripts/build-static-sitemaps.mjs` — CLI:
  - `npm run sitemaps:static` → grava `.static-sitemaps/sitemap-index.xml` +
    `sitemap-0..N.xml` (diretório gitignored);
  - `npm run sitemaps:static:check` → falha se o artefato divergir de `data/`;
  - valida coerência com `frontend/src/generated/indice-snapshot.json`
    (`urls.total`, `competencia`, número de shards), então o índice central não
    pode apontar para um artefato com contagem diferente.
- `indice/scripts/lib/static-sitemaps.test.mjs` — 10 testes novos.
- `.github/workflows/indice-ci.yml` — gera e valida o artefato em todo PR/push.

Resultado medido:

```
$ cd indice && npm run sitemaps:static
shards: 0=10000 URLs (1.060.852 B), 1=10000 (1.071.097 B), 2=8853 (945.379 B)
total: 28853
$ npm run sitemaps:static:check
[static-sitemaps] artefato íntegro e atualizado: 28853 URLs em 3 shards.
```

Prova de equivalência com o app — URLs geradas comparadas com as que o próprio app
serviu em build local (`/indice/sitemap/{0,1,2}.xml`):

```
app 28853 | artefato 28853 | faltam no artefato 0 | sobram no artefato 0
```

### 2.2 hreflang alinhado entre sitemap e HTML

`frontend/src/app/sitemap.ts`: os alternates passaram por uma função única
`alternatesFor()`, que (a) exclui `zh` — páginas `/zh` são `noindex` e não entram
como `<loc>` — e (b) declara `x-default` exatamente como o HTML: `pt-BR` quando
existe versão em português, `en` quando o artigo só existe traduzido.

| Build | pt-BR | en | es | zh | x-default | URLs | lastmod |
|---|---|---|---|---|---|---|---|
| produção hoje (build antigo) | 84 | 86 | 86 | **84** | **0** | 97 | 0 |
| `main` antes da correção | 84 | 86 | 86 | 0 | 0 | 106 | 84 |
| **branch corrigida (medido)** | **84** | **86** | **86** | **0** | **86** | **106** | **84** |

Conferido no HTML publicado: `/`, `/en`, `/planos` e
`/en/blog/ai-review-analysis-guide` declaram `pt-BR/en/es/x-default` (ou
`en/es/x-default` no artigo só traduzido) — o mesmo conjunto que o sitemap passa a
declarar.

### 2.3 `robots.txt` sem descoberta duplicada

`frontend/src/app/robots.ts`: removida a diretiva `Sitemap: /sitemap.xml`, que é
filho do índice central já declarado. Mantidos `sitemap-index.xml` (site) e
`indice/sitemap-index.xml` (app separado). O arquivo `/sitemap.xml` continua no ar
para consumidores externos (`submit-indexnow.mjs`).

### 2.4 Gate de produção (novo)

`frontend/scripts/verify-production-seo.mjs` (`npm run seo:verify-production`)
valida o artefato **publicado**, não o código:

- índice central 200, é `<sitemapindex>`, declara o leaf e todos os shards do
  snapshot, não referencia índice aninhado;
- `/sitemap.xml`: 200, sem duplicatas, sem URLs `/indice`, com `lastmod`, sem `zh`,
  com `x-default`, contendo `/planos`, `/metodologia`, `/glossario`,
  `/calculadora-nota-google`;
- `robots.txt`: declara o índice central, bloqueia `/api/`, grupos de IA presentes;
- **20 requisições consecutivas por shard**, sem aceitar 429/503; resposta vinda de
  cache do Worker é **WARN explícito**; content-type XML; ≤10.000 URLs; sem
  parâmetro/barra final; soma dos shards = `snapshot.urls.total`;
- todos os links de `llms.txt`/`llms-full.txt` respondem 200;
- todas as URLs do leaf respondem 200, com canonical próprio e sem `noindex`;
- gêmeas `.md` respondem 200 `text/markdown` (opcional com `--skip-twins`).

Esse gate é o que faltava: em 31/10 o CI, o build e 58.709 asserções locais estavam
verdes enquanto a produção servia outro artefato.

### 2.5 Guardrails de fonte

`frontend/scripts/validate-seo.mjs` ganhou 7 verificações: `alternatesFor()`
existe, exclui `zh`, declara `x-default`, o sitemap não emite `zh`, o HTML mantém
`x-default`, `robots.txt` declara o índice central, **não** redeclara o leaf e
mantém o índice do Índice.

### 2.6 Documentação

- `indice/DEPLOY.md` — estado real de 31/10 (suspensão Render, shard 1 em 429,
  cache ≠ disponibilidade) + seção "Sitemap como artefato estático".
- `SEO_INDEXING_RUNBOOK.md` — registro do incidente, regra "cached 200 não é
  disponibilidade" e o gate automatizado.
- `indice/README.md` — comandos novos do artefato estático.
- `frontend/src/app/sitemap-index.xml/route.ts` — comentário que fixava "106 URLs"
  agora descreve o leaf sem número.

---

## 3. Branch e PR

- Branch de trabalho: **`cline/zv5xh6c6`**, criada a partir de `main` @ `4a31e3a7`.
- `main` não foi tocada, não houve merge, não houve force push, histórico preservado.
- PR aberta em **rascunho** (`draft`): ver URL no rodapé desta entrega / `gh pr list`.
- Commit(s):
  1. `fix(seo): sitemap estático do Índice, hreflang x-default e gate de produção`
  2. `docs(seo): relatório final da recuperação DSV4`

## 4. Testes executados e resultados

| Suíte | Comando | Resultado |
|---|---|---|
| Testes unitários do Índice (+10 novos) | `cd indice && npm test` | **70/70 pass, 0 fail** |
| Gerador do artefato estático | `npm run sitemaps:static` | 28.853 URLs → 3 shards (10.000/10.000/8.853) |
| Integridade do artefato | `npm run sitemaps:static:check` | `artefato íntegro e atualizado: 28853 URLs em 3 shards` |
| Equivalência artefato × app | comparação de `<loc>` | 28.853 = 28.853, 0 faltando, 0 sobrando |
| Build do frontend | `cd frontend && npm run build` | **build_exit=0** |
| Sitemap gerado pelo build | `.next/server/app/sitemap.xml.body` | **106 URLs**, 84 `lastmod`, hreflang `pt-BR 84 / en 86 / es 86 / x-default 86`, **0 `zh`** |
| Índice central gerado | `sitemap-index.xml.body` | leaf + 3 shards, `<sitemapindex>` válido |
| Guardrails de fonte | `npm run seo:validate` | `SEO source validation passed` |
| Guardrail de marca/conteúdo | `node spec-kit/audit-seo-brand.mjs` | PASSED |
| Worker de resiliência | `node --test infra/cloudflare/filtra-indice-proxy.test.mjs` | 3/3 pass |
| Suíte SEO integrada do Índice | `cd indice && npm run test:seo` | 58.709 PASS / 0 FAIL (executada em 31/10 na auditoria, código do Índice não alterado funcionalmente) |
| Gate de produção (novo) | `npm run seo:verify-production --samples=20` | **FAIL esperado** — ver §7 (produção não serve o build aprovado) |

## 5. Situação atual do serviço Render

| Item | Estado verificado |
|---|---|
| `filtra-indice.onrender.com` | **suspenso** — `503`, corpo `This service has been suspended.` |
| Motivo | suspensão por billing (informado pelo usuário; o corpo da resposta confirma suspensão) |
| Plano / eventos de billing / último deploy | **não verificável** — sem API/token Render no ambiente (`RENDER_API_KEY` ausente) e o painel é privado |
| Build/start configurados no repo | `indice/package.json`: build `node scripts/check-data.mjs && next build`, start `node server.mjs` (`indice/DEPLOY.md`) |
| Funcionamento no Free | tecnicamente sim para servir o app, mas o Free dorme e consome horas compartilhadas; foi por isso que o keepalive foi desativado em `4a31e3a7` |
| Substituição sem duplicar arquitetura | **preparada**: o sitemap virou artefato estático (§2.1). As páginas HTML continuam exigindo um runtime Node (Next com ISR) — não existe hoje serviço redundante no projeto que possa assumi-las |
| Reativação | **não executada**: exigiria acesso ao painel/billing do Render, o que está fora da autorização ("não contrate plano pago / não altere billing") |

## 6. Situação dos três shards

| Shard | URLs no artefato | Produção agora | Cache do Worker? |
|---|---|---|---|
| `/indice/sitemap/0.xml` | 10.000 | **200** | sim (`x-indice-proxy: render-cache`, `STALE`, `age ≈ 30 h`) |
| `/indice/sitemap/1.xml` | 10.000 | **429** (desafio Cloudflare; origem 503) | não |
| `/indice/sitemap/2.xml` | 8.853 | **200** | sim (`STALE`) |
| **Total** | **28.853** | descoberta parcial (18.853) | — |

Os 200 dos shards 0 e 2 **não são disponibilidade**: são cópias de 30/10 no edge,
por PoP, com validade máxima de 7 dias (`STALE_CACHE_SECONDS = 604800`). Quando
expirarem sem origem, os três shards passam a falhar.

---

## 7. Status do sitemap principal

| Item | Produção agora | Branch corrigida (build local medido) |
|---|---|---|
| URLs | 97 | **106** |
| `<lastmod>` | 0 | **84** |
| hreflang `zh` | 84 | **0** |
| hreflang `x-default` | 0 | **86** |
| `/planos`, `/metodologia`, `/glossario`, `/calculadora-nota-google` | ausentes | **presentes** |
| URLs do Índice misturadas | não | não |
| URLs respondendo 200 | 97/97 | (depende do deploy) |

Diagnóstico definitivo: as 97 URLs de produção correspondem a um build **anterior**
a `#106` (`7edcaab3`, que criou `/metodologia` e `/glossario`) e a `#135`
(buyer guides) e `#134` (panorama). O código em `main` já está correto nesses
pontos; o artefato publicado é que está velho. **Correção = deploy do frontend**
(bloqueado nesta tarefa).

## 8. Status de AEO e GEO

| Item | Estado |
|---|---|
| `llms.txt` / `llms-full.txt` do site principal | 200; conteúdo factual, FAQs com resposta direta e fonte |
| Links do `llms.txt` para o Índice | **4 links 503** enquanto o Render estiver suspenso (`/indice`, `/indice/metodologia`, `/indice/llms.txt`, `/indice/llms-full.txt`). Mantidos de propósito: são URLs canônicas reais do produto e voltam a responder quando o serviço voltar. O gate novo acusa exatamente esses links |
| `llms.txt` / `llms-full.txt` do Índice | implementados e derivados dos dados (não hardcoded); **503 em produção** |
| Gêmeas `.md` do Índice | implementadas com `Link: rel=canonical` + `X-Robots-Tag: noindex, follow`; **503 em produção** |
| Gêmeas `.md` do site principal | **404** em produção: o gerador só escreve em `out/` (export estático) e o host atual não serve `out/`; a cópia pública do `llms.txt` não lista `.md`, então **não há link quebrado anunciado** — é uma promessa não cumprida, não um link morto |
| `robots.txt` para crawlers de IA | 16 UAs explícitos (GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot, Google-Extended, CCBot, PerplexityBot, Applebot-Extended, meta-externalagent, Amazonbot, …) |
| IndexNow | chave 200; envio **bloqueado** porque `submit-indexnow.mjs` lê `/indice/sitemap/1.xml` (429) |
| Dados estruturados | `Organization`, `WebSite`, `SoftwareApplication`+`Offer`, `BreadcrumbList`, `DefinedTermSet`, `FAQPage`, `Dataset`, `BlogPosting` — nenhum `AggregateRating`/preço/nota inventados |
| Conteúdo original citável | contagens por município × segmento com fonte primária, competência, janela e técnica de medição |

Não foi adicionada nenhuma convenção como se fosse fator de ranqueamento: `llms.txt`
segue documentado como convenção emergente (`indice/src/lib/llms.ts:17-22`).

## 9. Custos

- **Nenhuma contratação, upgrade, cartão ou alteração de billing foi realizada.**
- Nenhum serviço pago foi criado; nenhum limite de gasto foi alterado.
- Nenhum cron recorrente foi ativado (o `indice-keepalive` segue manual).
- O único consumo foi de rede/CPU no ambiente de execução (build e testes locais).

## 10. Itens que dependem de acesso externo ou aprovação

| # | Item | Depende de | Ação preparada |
|---|---|---|---|
| 1 | Reativar `filtra-indice` | painel/billing Render (proprietário) | nada a codar; documentado em `indice/DEPLOY.md` |
| 2 | Publicar o build do frontend (sitemap 106 URLs, `lastmod`, `x-default`, sem `zh`, `.md`) | deploy Vercel/Render (proibido aqui) | PR pronta com diff e evidências |
| 3 | Servir o sitemap estático do Índice | deploy (Pages/R2/KV ou host estático) | `npm run sitemaps:static` + artefato validado |
| 4 | Reenviar sitemap no GSC/Bing e confirmar indexação | GSC (conector indisponível) | `npm run seo:verify-production` como pré-condição |
| 5 | Enviar IndexNow | depende de 1 ou 3 | `npm run seo:indexnow -- --dry-run` passa a funcionar |
| 6 | Confirmar 20× 200 nos três shards | depende de 1 ou 3 | critério já implementado no gate |

---

## 11. Evidências concretas

### 11.1 Arquivos alterados (branch `cline/zv5xh6c6`)

```
.github/workflows/indice-ci.yml          +5    gera e valida o sitemap estático no CI
SEO_INDEXING_RUNBOOK.md                  +21   incidente 31/10, “cache != disponibilidade”, gate
frontend/package.json                    +1    script seo:verify-production
frontend/scripts/validate-seo.mjs        +44   guardrails zh/x-default/robots
frontend/scripts/verify-production-seo.mjs  NEW  gate de produção (20 amostras/shard)
frontend/src/app/robots.ts               +7/-1 remove Sitemap duplicado
frontend/src/app/sitemap-index.xml/route.ts  +2/-1 comentário sem contagem fixa
frontend/src/app/sitemap.ts              +27/-22 alternatesFor(): sem zh, com x-default
indice/.gitignore                        +3/.static-sitemaps/
indice/DEPLOY.md                         +37/-8 estado real + artefato estático
indice/README.md                         +6   comandos do artefato
indice/package.json                      +2   sitemaps:static / :check
indice/scripts/build-static-sitemaps.mjs    NEW  CLI do artefato
indice/scripts/lib/static-sitemaps.mjs      NEW  cálculo + XML + validação
indice/scripts/lib/static-sitemaps.test.mjs NEW  10 testes
```

### 11.2 Comandos e saídas

```
$ cd indice && npm test
ℹ tests 70   ℹ pass 70   ℹ fail 0

$ npm run sitemaps:static
shards: 0=10000 (1.060.852 B) 1=10000 (1.071.097 B) 2=8853 (945.379 B)  total=28853

$ npm run sitemaps:static:check
[static-sitemaps] artefato íntegro e atualizado: 28853 URLs em 3 shards.

$ node -e "compara <loc> do app vs artefato"
app 28853 | artefato 28853 | faltam no artefato 0 | sobram no artefato 0

$ cd frontend && npm run build
build_exit=0

$ node -e "lê .next/server/app/sitemap.xml.body"
urls 106  lastmod 84  hreflang {"pt-BR":84,"en":86,"es":86,"x-default":86}
/planos true  /metodologia true  /glossario true  /calculadora-nota-google true

$ npm run seo:validate
SEO source validation passed: 20 canonical paths, 28 hreflang families and 134 sitemap path literals

$ node spec-kit/audit-seo-brand.mjs
SEO/brand guardrail PASSED

$ node --test infra/cloudflare/filtra-indice-proxy.test.mjs
ℹ tests 3  ℹ pass 3  ℹ fail 0
```

### 11.3 Gate de produção contra a produção atual (evidência do bloqueio)

Saída real de `npm run seo:verify-production --samples=20 --skip-twins` em
31/10/2026, contra `https://filtraai.com`:

```
== Índice central
PASS sitemap-index.xml 200 (409 bytes)
== Sitemap principal
PASS /sitemap.xml 200 com 97 URLs
FAIL /sitemap.xml publicado sem nenhum <lastmod> (build antigo?)
FAIL /sitemap.xml declara 84 alternates zh para páginas noindex
FAIL /sitemap.xml sem hreflang x-default (o HTML declara x-default)
FAIL /sitemap.xml não inclui /planos
FAIL /sitemap.xml não inclui /metodologia
FAIL /sitemap.xml não inclui /glossario
FAIL /sitemap.xml não inclui /calculadora-nota-google
== robots.txt
PASS robots.txt declara o índice central
== Shards do Índice (20 requisições consecutivas por shard)
PASS /indice/sitemap/0.xml: 20/20 respostas 200
WARN /indice/sitemap/0.xml: servido de cache do Worker (render-stale-cache); confirme a origem
PASS /indice/sitemap/0.xml: 10000 URLs, content-type application/xml
FAIL /indice/sitemap/1.xml: 20/20 respostas não-200 (429)
PASS /indice/sitemap/2.xml: 20/20 respostas 200
WARN /indice/sitemap/2.xml: servido de cache do Worker (render-stale-cache); confirme a origem
PASS /indice/sitemap/2.xml: 8853 URLs, content-type application/xml
FAIL shards acessíveis somam 18853 URLs; snapshot declara 28853
== llms.txt / llms-full.txt
FAIL /llms.txt aponta para /indice, /indice/metodologia, /indice/llms.txt, /indice/llms-full.txt → 503
FAIL /llms-full.txt aponta para /indice e /indice/metodologia → 503
== Páginas do sitemap principal
PASS 97 URLs responderam 200 com canonical próprio
== Resumo
Verificação de produção FALHOU (17 problemas): a produção não serve o artefato esperado.
```

Detalhe observado durante a execução: os shards 0 e 2 passaram de `render-cache`
(cópia fresca, `age ≈ 107.8k s` no início da auditoria) para
**`render-stale-cache`** (último valor bom). A disponibilidade dos dois degradou
durante a própria auditoria — o que confirma que aquele 200 não é produção
saudável e expira em até 7 dias (`STALE_CACHE_SECONDS`).

## 12. Estado final do Git

```
$ git status --porcelain      → (vazio)
$ git log --oneline -3
<docs>  docs(seo): relatório final da recuperação DSV4
<code>  fix(seo): sitemap estático do Índice, hreflang x-default e gate de produção
4a31e3a7 chore: disable scheduled indice keepalive to conserve Render free hours   (main, intacta)
$ git branch
* cline/zv5xh6c6
  main
```

- `main` permanece exatamente em `4a31e3a7`.
- Nenhum force push, nenhum rebase de histórico publicado, nenhum arquivo removido.
- Artefatos de build (`frontend/.next`, `indice/.static-sitemaps`) são gitignored e
  foram removidos da árvore antes do commit final.

---

## Critério final desta entrega

| Critério exigido | Resultado |
|---|---|
| Infraestrutura realmente acessível | **NÃO** — Render suspenso por billing; sem autorização para reativar |
| Sitemaps válidos | **SIM no código/artefato** (3 shards, 28.853, XML válido, sem duplicatas, equivalência com o app provada) |
| Testes de produção aprovados | **NÃO** — gate criado e executado; acusa 17 falhas reais da produção atual |
O bloqueio é único e externo: **billing do Render** (reativar) ou **deploy**
(publicar o build + o artefato estático). Todo o restante está feito, testado e
versionado na branch, pronto para o merge/deploy por quem tiver essa alçada.
