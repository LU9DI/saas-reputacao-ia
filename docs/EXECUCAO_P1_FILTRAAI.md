# Execução P1 — Links internos contextuais para o Índice Filtra.AI

**PR:** #201 — `seo/p1-links-contextuais-2026-11-08`
**Repositório:** `LU9DI/saas-reputacao-ia`
**SHA de implementação validado:** `b506b5a36f8e5ad7778098142c5a426f3f0a3370`
**Correções posteriores no branch:** `cccc213f` (destino de franquias), `83b44a60` (testes P1 no CI), `5973df8d` (Worker Cloudflare), `a7c86cb3` (teste de regressão do Worker), `600f8d8a` (guardrail anti-404 de segmento)
**HEAD funcional validado:** `0086164fb6503c8520d563b0131684cd065ce897` (sem alterações funcionais posteriores)
**HEAD remoto atual:** `86ecf3f55f2992430f1afbe512ed7b85713b83fb` (commit documental; checks deste SHA aguardando execução/conclusão)
**Base:** `origin/main` = `9be7edaba9a4af2107a480a476247ff9f5cacf32` (Merge PR #200)
**Atualizado em:** 10/11/2026

### Mapa de SHAs (HEAD atual × marcos históricos)

| SHA | Papel | Observação |
|---|---|---|
| `b506b5a3` | Marco: 1ª validação completa (frontend + guardrail de CI) | referenciado nas seções 3 a 8 como contexto histórico |
| `cccc213f` | Correção de conteúdo: destino do artigo de franquias | `/indice` em vez do ranking inexistente |
| `83b44a60` | CI: executa os testes P1 no job de frontend | `.github/workflows/ci.yml` |
| `5973df8d` | **Correção funcional do Worker Cloudflare** | 1 linha removida em `decorate()` |
| `a7c86cb3` | Teste de regressão do Worker | `backend/tests/worker.failover.test.ts` |
| docs `1b41dd4a`…`c6578030` | Apenas documentação | sem efeito funcional |
| `600f8d8a` | Teste: segmento publicado no Índice | `test-seo-p1-links.mjs` rejeita segmento sem página |
| `0086164f` | HEAD funcional/documental anterior | validação funcional e gates locais descritos na §14 |
| `42ea1b2` | Commit documental anterior | CI e Dependency audit verdes |
| **`86ecf3f5`** | **HEAD remoto atual** (documentação) | sincronização final deste registro; checks próprios pendentes |

As seções 3 a 8 preservam as evidências dos marcos históricos. O estado atual
do branch e os checks revalidados estão na seção 14.

O HEAD remoto atual é `86ecf3f55f2992430f1afbe512ed7b85713b83fb`. Os commits `42ea1b2` e `86ecf3f5` alteram somente este documento; a validação funcional permanece referenciada ao HEAD `0086164f` e aos marcos de implementação listados acima.

---

## 1. Estado do Git

- Branch de trabalho: `seo/p1-links-contextuais-2026-11-08`, criada a partir de
  `origin/seo/p1-links-contextuais-2026-11-08` (upstream configurado).
- HEAD de referência informado na tarefa: `c26c903b`. O branch remoto já estava
  em `34dab4c7` (merge não destrutivo que preservou os commits locais `fa26bb31`
  e os commits remotos `c26c903b`…`7a648e43`).
- Working tree limpo no início; ao final, apenas os arquivos desta tarefa foram
  alterados.
- Nenhum `reset --hard`, `clean`, `checkout`/`restore` destrutivo, rebase,
  force-push, tag ou merge em `main`.
- Atualização do remoto apenas por fast-forward (`34dab4c7..b506b5a3`).
- **Nota de marco:** esta seção descreve o estado do Git no marco `b506b5a3`.
  O estado atual revalidado (HEAD `0086164f`, local == remoto, base
  `origin/main` = `9be7edab`) está na seção 14.

## 2. Alterações de código (10 arquivos)

| # | Arquivo | Alteração | Destino |
|---|---------|-----------|---------|
| 1 | `frontend/src/app/components/SeoPageHeader.tsx` | Link do header SEO para o Índice | `/indice` |
| 2 | `frontend/src/app/preview/page.tsx` | Link no header da home + card em `seo.links` (PT/EN/ES/ZH) + link de rankings ativos | `/indice`, `/indice/rankings/ativos`, `/indice/rankings/ativos/restaurantes` |
| 3 | `frontend/src/app/blog/reputacao-online-hoteis/page.tsx` | Link contextual | `/indice/rankings/ativos/hoteis` |
| 4 | `frontend/src/app/blog/reputacao-online-clinicas/page.tsx` | Link contextual | `/indice/rankings/ativos/clinicas` |
| 5 | `frontend/src/app/blog/reputacao-franquias-multilocal/page.tsx` | Link contextual para o Índice geral (não há ranking de franquias) | `/indice` |
| 6 | `frontend/src/app/blog/avaliacoes-google-restaurantes/page.tsx` | Link contextual | `/indice/rankings/ativos/restaurantes` |
| 7 | `frontend/src/app/blog/gestao-reputacao-online-guia/page.tsx` | Link contextual (preserva PR #199) | `/indice/rankings/ativos/restaurantes` |
| 8 | `frontend/src/app/blog/qr-code-balcao-reviews/page.tsx` | Link contextual (preserva PR #199) | `/indice/rankings/ativos/restaurantes` |
| 9 | `frontend/src/app/blog/como-responder-avaliacoes-negativas/page.tsx` | Link contextual | `/indice/rankings/ativos/restaurantes/rj` |
| 10 | `frontend/src/app/blog/seo-local-avaliacoes-local-pack/page.tsx` | Link contextual | `/indice/sp/sao-paulo/restaurantes` |

**Testes e scripts:**

- `frontend/scripts/test-seo-p1-links.mjs` — 13 testes (destinos, rotas do app do
  Índice e segmentos existentes no snapshot).
- `frontend/scripts/test-p1-internal-links.mjs` — 8 testes (P1-1 a P1-6 e
  regressão do PR #199).
- `frontend/scripts/validate-seo.mjs` — correção do guardrail que reprovava o
  CI (ver seção 3).
- `frontend/package.json` — scripts `test:seo:p1-links` e
  `test:p1-internal-links`.

**Links do PR #199 preservados** (cobertos por teste):

- `/blog/gestao-reputacao-online-guia` → `/blog/como-responder-avaliacoes-negativas`
- `/blog/gestao-reputacao-online-guia` → `/blog/qr-code-balcao-reviews`
- `/blog/qr-code-balcao-reviews` → `/feedback-de-clientes`
- `/blog/review-1-estrela-primeiras-24-horas` → `/feedback-de-clientes`

**Restrições respeitadas:** nenhum self-link nos artigos alterados, nenhum link
para páginas noindex/teste (`/preview/teste`, `/teste`), nenhum novo link `/zh/`,
nenhuma alteração de canonical, schema, sitemap, metadados, DNS, Cloudflare,
Render, Supabase ou billing. Textos PT/EN/ES/ZH da home mantidos no padrão de
ternários por idioma já usado pela página; header e artigos seguem em português,
consistente com o restante dessas páginas.

## 3. Causa da falha de CI e correção

**Falha reproduzida localmente:** job `SEO + brand guardrail` →
`AssertionError: - Local SEO article links to a route without a static page:
/indice/sp/sao-paulo/restaurantes`. O job `CI summary` falhava apenas por
agregar esse job.

**Causa:** `frontend/scripts/validate-seo.mjs` valida todo `<Link href="/…">` do
artigo de SEO local contra `frontend/src/app`, mas o Índice é um app Next
separado (`indice/`, `basePath: /indice`) servido em `filtraai.com/indice` por
rota do Cloudflare. O destino existe e responde 200, porém não é uma página
deste app.

**Correção aplicada:** em vez de ignorar links `/indice`, o guardrail agora
resolve o caminho contra a árvore de rotas do app do Índice (route groups
`(br)`/`(us)`, segmentos dinâmicos `[uf]`/`[segmento]` e catch-all), com
mensagem própria (`nonexistent Índice route`). Assim o link continua validado.

**Evidência de que a checagem não foi enfraquecida (teste negativo manual):**
com um link injetado temporariamente para `/indice/foo/bar/baz/qux/quux` o
guardrail falhou com `Local SEO article links to a nonexistent Índice route`;
o arquivo temporário foi revertido em seguida (working tree limpo).

**Cobertura nova no teste obrigatório:** `test:seo:p1-links` passou a verificar
os 8 destinos da rodada (incluindo `/indice/sp/sao-paulo/restaurantes` e
`/indice/rankings/ativos/restaurantes/rj`) e a resolver todo href `/indice` dos
arquivos alterados contra as rotas de `indice/src/app`.

## 4. Testes executados (resultados reais)

Todas as execuções locais ocorreram em Node.js `v26.7.0` / npm `11.19.0`
(o CI usa Node 22). Ambiente Windows; rede disponível.

| Comando | Resultado |
|---------|-----------|
| `npm run test:seo:p1-links` (frontend) | **13/13 pass**, 0 fail |
| `npm run test:p1-internal-links` (frontend) | **8/8 pass**, 0 fail |
| `npm run test:analytics` (frontend) | **13/13 pass**, 0 fail |
| `npm run seo:validate` (frontend) | **pass** — 21 canonical paths, 28 hreflang families, 135 sitemap path literals |
| `node spec-kit/audit-seo-brand.mjs` (raiz) | **pass** — nenhuma linguagem proibida |
| `npm run lint` (frontend) | **0 erros**, 108 warnings pré-existentes (nenhum nos arquivos alterados; inclui `no-unused-vars` histórico de `collectSourceFiles` em `validate-seo.mjs`) |
| `npm run build` (frontend, `NEXT_PUBLIC_API_URL=http://127.0.0.1:5000`) | **exit 0** — 163 páginas estáticas, guardrail de `<html lang>` OK, 106 markdown twins, `Meta audit PASSED: 107 URLs` |

Não executados nesta rodada (cobertos pelo CI do PR): export estático
`CLOUDFLARE_PAGES=1`, `seo:audit`, `seo:markdown:validate` e os jobs de
backend/Índice — todos com resultado **pass** no HEAD `b506b5a3`.

## 5. Validação dos 7 destinos válidos (produção) — marco `b506b5a3`

> Nota: o 8º destino da rodada (`/indice/rankings/ativos/franquias`, respondendo
> **404**) foi removido depois e hoje é rejeitado explicitamente por dois
> testes — ver seção 13.4.

Consultados via HTTP em 09/11/2026 (sem seguir redirect; `canonical` e `robots`
extraídos do HTML servido):

| URL | HTTP | canonical | robots | title |
|-----|------|-----------|--------|-------|
| `https://filtraai.com/indice` | 200 | autorreferente | `index, follow` | Índice Filtra.AI: estabelecimentos ativos por município |
| `https://filtraai.com/indice/rankings/ativos` | 200 | autorreferente | `index, follow` | Rankings de estabelecimentos ativos por segmento e estado |
| `https://filtraai.com/indice/rankings/ativos/hoteis` | 200 | autorreferente | `index, follow` | Ranking de hotéis no Brasil: outubro de 2026 |
| `https://filtraai.com/indice/rankings/ativos/clinicas` | 200 | autorreferente | `index, follow` | Ranking de clínicas no Brasil: outubro de 2026 |
| `https://filtraai.com/indice/rankings/ativos/restaurantes` | 200 | autorreferente | `index, follow` | Ranking de restaurantes e bares no Brasil: outubro de 2026 |
| `https://filtraai.com/indice/sp/sao-paulo/restaurantes` | 200 | autorreferente | `index, follow` | Restaurantes e bares em São Paulo (SP): 79.301 ativos |
| `https://filtraai.com/indice/rankings/ativos/restaurantes/rj` | 200 | autorreferente | `index, follow` | Ranking de restaurantes e bares no Rio de Janeiro |

## 6. Deploy de preview (Vercel) — marcos `34dab4c7` e `b506b5a3`

- **HEAD `34dab4c7`:** deploy `success`, preview
  `https://saas-reputacao-he3jfn2gb-lu9di.vercel.app` (verificado, HTML servido).
- **HEAD `b506b5a3` (SHA de implementação):** deploy `success`, preview
  `https://saas-reputacao-jmy2r3qo9-lu9di.vercel.app` — status GitHub `Vercel`
  em `https://vercel.com/lu9di/saas-reputacao-ia/GiThDGDJAqwP58fWZkELJ2PfAYQC`.
- Os previews **não** exigem autenticação; HTML foi obtido por HTTP.

HTML renderizado no preview de `b506b5a3` (SSR, HTTP 200 em todas as páginas):

| Página | hrefs `/indice` encontrados no HTML |
|--------|-------------------------------------|
| `/` | `/indice`, `/indice/rankings/ativos`, `/indice/rankings/ativos/restaurantes`, `/indice/us` |
| `/blog/reputacao-online-hoteis` | `…/ativos/hoteis` (+ header/footer `/indice`, `/indice/us`, `/indice/metodologia`) |
| `/blog/reputacao-online-clinicas` | `…/ativos/clinicas` |
| `/blog/reputacao-franquias-multilocal` | `/indice` (Índice geral; não existe ranking de franquias) |
| `/blog/avaliacoes-google-restaurantes` | `…/ativos/restaurantes` |
| `/blog/gestao-reputacao-online-guia` | `…/ativos/restaurantes` |
| `/blog/qr-code-balcao-reviews` | `…/ativos/restaurantes` |
| `/blog/como-responder-avaliacoes-negativas` | `…/ativos/restaurantes/rj` |
| `/blog/seo-local-avaliacoes-local-pack` | `/indice/sp/sao-paulo/restaurantes` |

Âncora conferida no HTML: `<a class="text-indigo-300 underline"
href="/indice/rankings/ativos/hoteis">ranking nacional de hotéis no Índice
Filtra.AI</a>`.

**Limite conhecido do ambiente de preview:** `GET /indice` no domínio do preview
retorna **404**, porque o Índice é um deployment separado roteado por Cloudflare
apenas no domínio de produção (`filtraai.com/indice`). Isso não é regressão
desta PR — os destinos foram validados diretamente em produção (seção 5) e as
rotas existem em `indice/src/app`.

## 7. Checks do GitHub (marco `b506b5a3`, histórico)

Todos os 13 checks do PR #201 em `success`:

| Check | Resultado |
|-------|-----------|
| SEO + brand guardrail | pass (era **fail** antes da correção) |
| CI summary | pass (era **fail** por agregar o job acima) |
| Frontend (static export) | pass |
| Frontend (Vercel build) | pass |
| Backend (test + typecheck) | pass |
| Índice (tests + typecheck + build) | pass |
| Cloudflare Índice sitemap resilience | pass |
| Audit root / backend / frontend / indice | pass |
| Vercel / Vercel Preview Comments | pass |

## 8. Estado do PR #201 (marco `b506b5a3`, histórico)

- Título: *SEO P1: adicionar links internos contextuais para o Índice Filtra.AI*
- Base `main`, `mergeable: MERGEABLE`.
- Draft retirado após a validação acima (nenhum merge realizado).
- Alterações enviadas por fast-forward; nenhum force-push.

## 9. Pendências e riscos residuais

| Item | Status |
|------|--------|
| Merge do PR #201 | **não realizado** (fora do escopo; aguarda revisão humana) |
| Publicação em produção | **não realizada** — nenhum deploy manual, nenhuma URL submetida a indexação |
| Revalidação pós-merge | após o merge, conferir `https://filtraai.com/` e os 8 artigos em produção para confirmar a presença dos links no HTML servido |
| `/indice` no domínio de preview | 404 esperado (app separado); documentado na seção 6 |
| Warnings de lint | 108 pré-existentes, nenhum introduzido por esta PR |


## 10. Revisão técnica independente — correção adicional

Na revisão independente posterior à validação inicial, foi feita uma consulta HTTP direta a todos os destinos usados pelos links contextuais. O endereço `/indice/rankings/ativos/franquias`, usado no artigo `reputacao-franquias-multilocal`, retornou **404**. A árvore de rotas do app permitia a correspondência sintática, mas isso não garantia que existisse uma página publicada para esse segmento.

**Correção aplicada no branch:** o artigo de franquias agora aponta para `/indice`, com texto-âncora que convida o leitor a explorar os segmentos e dados efetivamente disponíveis, sem afirmar que existe ranking de franquias.

**Regressão coberta:** os testes `test-p1-internal-links.mjs` e `test-seo-p1-links.mjs` agora exigem o destino geral `/indice` e rejeitam explicitamente o antigo caminho inexistente. O conjunto `test-p1-internal-links.mjs` passa a ter 8 testes; o teste de SEO mantém o mesmo número de casos, com a asserção de franquias corrigida.

**Revalidação de produção:** os 7 destinos finais listados na seção 5 foram consultados novamente em 09/11/2026. Todos responderam sem erro, com canonical autorreferente e `robots: index, follow`. O caminho antigo de franquias foi excluído dos links.

**Status desta correção:** o código, os testes e o workflow foram atualizados diretamente na branch do PR. A execução final de CI foi concluída com sucesso no HEAD `83b44a6059f997401c9eb3dafb03c32cc3bdb32d`. Não houve merge nem publicação de produção.


## 11. CI final após a correção de franquias

**HEAD de código + workflow:** `83b44a6059f997401c9eb3dafb03c32cc3bdb32d`

- O job `Frontend (static export)` executou os dois comandos de regressão P1 adicionados ao workflow:
  - `npm run test:seo:p1-links` — concluído com sucesso.
  - `npm run test:p1-internal-links` — concluído com sucesso.
- `Frontend (static export)`, `Frontend (Vercel build)`, `SEO + brand guardrail`, `Backend (test + typecheck)`, `Índice (tests + typecheck + build)`, `Cloudflare Índice sitemap resilience`, `CI summary` e os quatro jobs de audit: **success**.
- Workflow `CI`: **success**.
- Workflow `Dependency audit`: **success**.
- Preview Vercel: `Vercel Preview Comments` **success**.
- Nenhum check do GitHub falhou ou ficou pendente no HEAD acima.

**Pendência externa:** não há revisão humana registrada no PR. A revisão automática do Codex também não foi concluída porque o limite de uso para code reviews foi atingido. O PR permanece aberto, fora de draft e mergeable; o merge continua aguardando revisão humana.


## 12. Revisão final do Worker Cloudflare — correção P1

A revisão do PR identificou que `infra/cloudflare/worker.js`, em `decorate()`, removia do HTML das rotas `/` e `/preview` âncoras cujo href era exatamente `/indice` (com ou sem domínio absoluto `filtraai.com`). Essa regra eliminava o novo link do header da home. Ela não removia os links descendentes como `/indice/rankings/ativos`; a descrição inicial do achado foi refinada após inspeção da expressão regular.

**Correção aplicada na branch:**
- Removida a transformação que apagava âncoras legítimas para `/indice`.
- Mantida a decoração dos headers e a limpeza de metadados de cache quando o HTML é reescrito (sem reescrita de conteúdo).
- Adicionado teste em `backend/tests/worker.failover.test.ts` que percorre o Worker para `/` e `/preview` e verifica a preservação de três formas de link: `/indice`, `/indice/rankings/ativos` e `https://filtraai.com/indice`.
- O arquivo faz parte do conjunto executado por `backend/scripts/dsv4-test-gate.mjs`, já chamado pelo job Backend do CI.

**CI do HEAD `1b41dd4ada8c0dd2913b5eb3a53773396668bb1c`:** workflow `CI` e `Dependency audit` concluídos com sucesso; 12/12 check-runs concluídos com sucesso. O job `Backend (test + typecheck)` passou, incluindo o `dsv4-test-gate.mjs` que executa `worker.failover.test.ts`; frontend estático, build Vercel, SEO, Índice, auditorias e CI summary também passaram.

**Verificação pública antes da publicação:** a captura HTTP de `https://filtraai.com/` confirmou a falha atual: o HTML não contém a âncora raiz `/indice` (nem o texto `Índice de empresas`), embora os links descendentes `/indice/rankings/ativos` e `/indice/us` permaneçam. Isso é consistente com a regra antiga removida nesta branch.

**Ainda pendente:** a correção do Worker precisa ser publicada no Cloudflare após aprovação/merge e, então, o HTML da home deve ser consultado novamente para confirmar a âncora `/indice`. A simulação do Worker e CI verde não substituem esse teste pós-deploy. Não houve deploy nem merge nesta etapa.


## 13. Rodada de finalização da revisão (09/11/2026)

Esta rodada revisou o diff completo do branch, reexecutou os gates e produziu as
evidências abaixo. Nenhum merge, force-push ou publicação foi realizado.

### 13.1 Diff do Worker revisado

`git show 5973df8d` altera **uma única linha** em `infra/cloudflare/worker.js`:
remove a substituição por regex em `decorate()` que apagava âncoras cujo href era
exatamente `/indice` (relativo ou absoluto) nas rotas `/` e `/preview`.

Nenhuma outra regra foi tocada: o restante de `decorate()` continua apenas
acrescentando `x-filtra-failover-origin` e, quando o HTML é reprocessado, removendo
`content-length`, `content-encoding` e `etag`. Failover, webhook, cache,
`readState`/`writeState`, `publicPath`, `fetchPrimary`/`fetchFallback` e os headers
de segurança permanecem idênticos ao commit anterior (`git diff 5973df8d^ 5973df8d`
= 1 remoção, 0 adições).

### 13.2 Testes do Worker e detecção real da regressão

- `node --test backend/tests/worker.failover.test.ts` (Node 26 com type stripping;
  o CI usa `tsx` via `dsv4-test-gate.mjs`): **5/5 pass**, incluindo
  `home and preview preserve internal Index anchors after Worker decoration`.
- **Prova de detecção:** com `git show 5973df8d^:infra/cloudflare/worker.js`
  restaurado temporariamente (regex antiga de volta), o mesmo arquivo de teste
  falhou: `AssertionError: / must preserve the root Index link` — 4/5 pass, 1 fail.
  O Worker corrigido foi restaurado em seguida (`git checkout --` do próprio
  arquivo, working tree limpo).

### 13.3 Gates reexecutados

| Comando | Resultado |
|---------|-----------|
| `npm run test:seo:p1-links` (frontend) | **13/13 pass**, 0 fail |
| `npm run test:p1-internal-links` (frontend) | **8/8 pass**, 0 fail |
| `npm run test:analytics` (frontend) | **13/13 pass**, 0 fail |
| `npm run seo:validate` (frontend) | **pass** — 21 canonical paths, 28 hreflang families, 135 sitemap paths |
| `node spec-kit/audit-seo-brand.mjs` | **pass** |
| `node node_modules/eslint/bin/eslint.js scripts/test-seo-p1-links.mjs` | **0 erros, 0 warnings** |
| `node --test backend/tests/worker.failover.test.ts` | **5/5 pass** |

O build de produção e o export estático não foram reexecutados localmente nesta
rodada: o único arquivo alterado é um script de teste `.mjs`, e o CI do HEAD
`c6578030` (que inclui `npm run build`, `Frontend (static export)` e
`Frontend (Vercel build)`) concluiu com sucesso.

### 13.4 Novo guardrail de segmento (anti-404)

O caso de franquias mostrou que a forma da rota (`[segmento]`) não garante página
publicada. `test-seo-p1-links.mjs` agora cruza todo href
`/indice/rankings/ativos/<segmento>` dos arquivos alterados com
`frontend/src/generated/indice-snapshot.json` (fonte: `indice/data`) e falha se o
segmento não existir. Verificado nos dois sentidos:

- com o conteúdo atual: **pass**;
- reintroduzindo `/indice/rankings/ativos/franquias` no artigo: **fail**
  (`usa segmento sem página publicada no Índice`), além do teste de franquias
  também falhar. Conteúdo revertido em seguida.

### 13.5 HTML público: origem vs. Worker publicado

| Origem consultada | `href="/indice"` (raiz) | `/indice/rankings/ativos` | `/indice/us` |
|---|---|---|---|
| `https://filtraai.com/` (via Cloudflare, `x-filtra-failover-origin: render-frontend-runtime`) | **0** | 1 | 1 |
| Deployment Vercel de `main` `9be7edab` (mesmo app, sem o Worker) `https://saas-reputacao-br8bhhpi2-lu9di.vercel.app/` | **1** | 1 | 1 |

O HTML de origem contém a âncora raiz e o HTML servido em produção não — o padrão
exato da regex removida. Isso confirma que **o Worker publicado em produção ainda
executa a regra destrutiva**; a correção só passa a valer depois de publicar o
Worker.

Limitação registrada: não foi possível inspecionar a versão publicada do Worker
por `wrangler` (a execução via `npx wrangler` não completou no ambiente local).
A conclusão acima vem do comportamento observado no HTML de produção comparado ao
HTML de origem, não de uma leitura direta do código publicado.

### 13.6 Preview do HEAD atual

Preview do HEAD `c6578030` (`https://saas-reputacao-kr02ozfvs-lu9di.vercel.app`,
sem autenticação), HTML SSR obtido por HTTP:

| Página | HTTP | hrefs `/indice` |
|---|---|---|
| `/` | 200 | `/indice` (×2, header + footer), `/indice/rankings/ativos` (×2), `/indice/rankings/ativos/restaurantes`, `/indice/us` |
| `/preview` | 200 | `/indice`, `/indice/rankings/ativos`, `/indice/rankings/ativos/restaurantes`, `/indice/us` |
| `/blog/reputacao-online-hoteis` | 200 | `/indice`, `/indice/rankings/ativos/hoteis`, `/indice/metodologia`, `/indice/rankings/ativos`, `/indice/us` |
| `/blog/reputacao-franquias-multilocal` | 200 | `/indice` apenas (âncora `Índice Filtra.AI`), sem ranking de franquias |

O preview não passa pelo Worker de failover, portanto representa o HTML de origem
do branch — com a âncora raiz preservada.

### 13.7 Destinos do Índice (produção, 09/11/2026)

Sete destinos usados pelos links contextuais: todos **200**, canonical
autorreferente e `robots: index, follow` (`/indice`, `/indice/rankings/ativos`,
`/indice/rankings/ativos/hoteis`, `/indice/rankings/ativos/clinicas`,
`/indice/rankings/ativos/restaurantes`, `/indice/sp/sao-paulo/restaurantes`,
`/indice/rankings/ativos/restaurantes/rj`). O caminho antigo
`/indice/rankings/ativos/franquias` responde **404** com `robots: noindex`,
confirmando que sua remoção dos links foi correta.

### 13.8 O que ainda impede a publicação

1. **Aprovação independente:** o PR não tem revisão aprovada; o autor não pode
   aprovar a própria mudança.
2. **Publicação do Worker:** o Worker publicado (`filtra-ai-failover`, rota
   `filtraai.com/*`) só pode ser atualizado após merge e autorização explícita.
   Enquanto isso, o link do header da home continuará sendo removido em produção.
3. **Revalidação pós-deploy:** depois de publicar, é obrigatório consultar
   `https://filtraai.com/` e confirmar `href="/indice"` no HTML servido. Testes
   locais e CI verde não substituem essa verificação.

---

## 14. Fechamento técnico DSV4 — validação funcional `0086164f`; commit documental anterior `42ea1b2` (10/11/2026)

Estado revalidado nesta rodada; não presume resultados anteriores.

### 14.1 HEAD e estado da PR

| Item | Valor verificado |
|---|---|
| Branch remoto | `seo/p1-links-contextuais-2026-11-08` |
| HEAD funcional validado | `0086164fb6503c8520d563b0131684cd065ce897` |
| HEAD remoto atual (`origin/seo/p1-links-contextuais-2026-11-08`) | `86ecf3f55f2992430f1afbe512ed7b85713b83fb` — commit documental posterior |
| Base (`origin/main`) | `9be7edaba9a4af2107a480a476247ff9f5cacf32` (Merge PR #200) |
| PR #201 | `OPEN`, não-draft, `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, `reviewDecision: ""` (sem aprovação), `reviews: []`, sem merge |
| Working tree local | não revalidado nesta consulta remota; o commit `42ea1b2` contém **exclusivamente** alterações neste arquivo documental |

O commit `42ea1b2` entrou no branch após a validação funcional `0086164f`; não altera código. A identidade do working tree local não foi inferida a partir do estado remoto.

### 14.2 Checks revalidados

**Validação funcional `0086164f` (evento `pull_request`):**

| Workflow | Run | Conclusão | Criado em |
|---|---|---|---|
| CI | `42653780994` | `success` | 2026-11-09T16:20:40Z |
| Dependency audit | `42653781067` | `success` | 2026-11-09T16:20:40Z |

`gh pr checks 201` (13/13 `pass`): Backend (test + typecheck), CI summary,
Cloudflare Índice sitemap resilience, Frontend (Vercel build), Frontend
(static export), SEO + brand guardrail, Índice (tests + typecheck + build),
Audit root/backend/frontend/indice, Vercel, Vercel Preview Comments.
Runs cancelados mais antigos (`42549529118`, `42549529219`) são superseded por
push posterior e não indicam falha.

**HEAD documental remoto `42ea1b2`:** CI run `42729099711` e Dependency audit run
`42729098360` — ambos `completed/success` (10/11/2026).

### 14.3 Arquivos funcionais auditados (diff `origin/main...0086164f`, 18 arquivos)

- `infra/cloudflare/worker.js` — **1 remoção**: a regex em `decorate()` que
  apagava âncoras `/indice` em `/` e `/preview`. Restante de `decorate()`,
  failover, webhook, cache, `readState`/`writeState`, `publicPath`,
  `fetchPrimary`/`fetchFallback` e headers de segurança: idênticos.
- `backend/tests/worker.failover.test.ts` — **+42**: teste de regressão que
  exige a preservação de `/indice`, `/indice/rankings/ativos` e
  `https://filtraai.com/indice` em `/` e `/preview`.
- `frontend/scripts/test-seo-p1-links.mjs` (novo), `frontend/scripts/test-p1-internal-links.mjs` (novo),
  `frontend/scripts/validate-seo.mjs` (guardrail resolve `/indice*` contra
  `indice/src/app` sem enfraquecer a checagem), `frontend/package.json` (+2 scripts),
  `.github/workflows/ci.yml` (+1 step executando os dois testes P1).
- `SeoPageHeader.tsx`, `preview/page.tsx`, 8 artigos: apenas adição de links
  contextuais `/indice*`; links do PR #199 preservados (verificados no diff).
- `docs/EXECUCAO_P1_FILTRAAI.md` — apenas documentação.
- **Ausências confirmadas (ok):** nenhum arquivo de DNS, Render, Supabase,
  billing, webhook, Vercel config ou wrangler no diff; nenhum self-link, link
  `/zh/` novo, link noindex/teste, ou alteração de canonical/schema/sitemap/robots.

### 14.4 Testes executados nesta rodada final (Node v26.7.0 / npm 11.19.0)

| Comando | Resultado |
|---|---|
| `npm run test:seo:p1-links` (frontend) | **13/13 pass** (reexecutado hoje) |
| `npm run test:p1-internal-links` (frontend) | **8/8 pass** (reexecutado hoje) |
| `node --test backend/tests/worker.failover.test.ts` | **5/5 pass** (reexecutado hoje) |
| `npm run seo:validate` (frontend) | **pass** — 21 canonical paths, 28 hreflang families, 135 sitemap paths |
| `npm run test:analytics` (frontend) | **13/13 pass** |

SHA funcional validado pelos testes locais: `0086164f`. O commit documental `42ea1b2` não modifica código; os workflows CI e Dependency audit também concluíram com sucesso nesse HEAD.

### 14.5 Resolução da inconsistência documental (§14.1 × §14.5 da rodada anterior)

A rodada DSV4 anterior descreveu correções documentais e ao mesmo tempo
registrou `M docs/EXECUCAO_P1_FILTRAAI.md` na working tree — ou seja, as
correções foram redigidas mas **não commitadas**. Nesta rodada:

- O arquivo foi primeiro restaurado ao HEAD (`git checkout --`) para partir de
  base limpa, sem descartar trabalho funcional (não havia nenhum — o diff local
  era 100% documental).
- As correções válidas foram reaplicadas de forma mínima: cabeçalho com HEAD
  atual + mapa de SHAs, nota de marco na §1, e rótulos "marco histórico" nas
  §§5–8 (conteúdo reproduzido acima, sem apagar evidências).
- As correções documentais foram commitadas no branch remoto em `42ea1b2`.
- O diff desse commit contém somente `docs/EXECUCAO_P1_FILTRAAI.md`; nenhum código funcional foi tocado.

### 14.6 Revisão independente

- `reviewDecision: ""`, `reviews: []`, `requested_reviewers: {users: [], teams: []}` — **nenhuma revisão humana**.
- Comentários recentes: apenas Vercel bot + comentário de encerramento do autor (`LU9DI`, OWNER).
- Tentativa de listar colaboradores via API falhou antes (TLS timeout); **nenhum
  revisor foi contatado, nenhum login/equipe foi inventado**.
- Gate registrado: depende de informação externa — informar qual login GitHub
  autorizado deve revisar; o autor não pode aprovar a própria PR.

### 14.7 Worker publicado (somente leitura)

- O Worker publicado (`filtra-ai-failover`, rota `filtraai.com/*`) **continua sem
  a correção** (evidência §13.5: HTML de produção sem `href="/indice"` raiz vs
  HTML de origem com a âncora).
- Nada foi publicado, nenhuma rota/DNS/variável/configuração foi alterada,
  nenhum deploy manual executado, nenhuma URL submetida ao Search Console.

### 14.8 Riscos residuais

1. Worker publicado ainda executa a regra destrutiva; a correção só vale após
   merge + publicação autorizada + revalidação do HTML de `https://filtraai.com/`.
2. Revalidação pós-merge/pós-deploy pendente (home + 8 artigos em produção).
3. Preview Vercel 404 em `/indice` é esperado (app separado via Cloudflare).

### 14.9 Confirmação explícita

Nenhum merge, fast-forward em `main`, force-push, bypass de branch protection,
aprovação própria, publicação de Worker, deploy manual, ou alteração em
produção/Render/Supabase/billing foi realizado. Nenhum trabalho local foi
apagado ou substituído.

### 14.10 Revalidação do HEAD remoto documental (`42ea1b2`)

- Commit `42ea1b2cd8b4a9f26d53b9011fc9a462990d2137` foi o HEAD remoto anterior e contém somente alterações documentais; foi sucedido pelo commit `86ecf3f5`.
- Diff do commit: somente `docs/EXECUCAO_P1_FILTRAAI.md`; nenhuma alteração funcional.
- CI run `42729099711`: `success`.
- Dependency audit run `42729098360`: `success`.
- PR #201 permanece `OPEN`, não-draft e mergeable; não há review humana aprovada nem reviewer solicitado.
- O Worker de produção não foi publicado; a correção em produção continua pendente de aprovação, merge e autorização explícita de deploy.

### 14.11 HEAD documental atual (`86ecf3f5`)

- Commit remoto atual: `86ecf3f55f2992430f1afbe512ed7b85713b83fb`.
- Alteração: somente `docs/EXECUCAO_P1_FILTRAAI.md`; nenhum arquivo funcional foi modificado.
- No momento desta atualização, os workflows associados a este SHA ainda não haviam sido retornados pela API; confirmar CI e Dependency audit antes de considerar o registro encerrado.
- PR #201 continua aberta e sem aprovação independente. Nenhum merge ou deploy do Worker foi realizado.
