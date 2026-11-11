# P1 — Descoberta interna do Índice Filtra.AI: implementação e revisão final

Data: 2026-11-10
Repositório: `LU9DI/saas-reputacao-ia`
Branch de trabalho: `feat/indice-internal-link-discovery-p1`
Base: `main` @ `63337c235b35b6c5291e2086266ad73ee782776e`

## 0. Aviso de reconstrução

Este documento **não** é uma revisão de um diff pré-existente. A branch
`feat/indice-internal-link-discovery-p1` e o diff de oito arquivos descritos na
tarefa **não existiam** no clone de trabalho, em `origin`, em PRs abertos nem em
commits pendurados/reflog no momento do diagnóstico.

Evidências do diagnóstico:

- `git branch -a` e `git ls-remote --heads origin` não retornavam a branch.
- A API do GitHub não encontrava a branch nem PR correspondente.
- O PR #201 (`SEO P1: adicionar links internos contextuais para o Índice
  Filtra.AI`) já estava **mergeado** em `main` desde `63337c23`.

Com a autorização do responsável ("Reconstruir a partir da main"), o escopo P1
descrito foi implementado **do zero** sobre `origin/main`. Consequências
registradas:

- **Nenhuma substituição de CTA por `/feedback-de-clientes` existia** em `main`;
  portanto não houve CTA a corrigir (seção 2).
- Os **links contextuais de artigos** para o Índice já existiam em `main`, vindos
  do PR #201; foram verificados e cobertos por teste, sem duplicação (seção 4.3).
- O trabalho novo concentra-se no **app do Índice** (`indice/`): breadcrumbs com
  marcador `indice`, BreadcrumbList canônico por rota, links ranking→hubs e
  navegação entre hubs dos EUA.

## 1. Preservação e diagnóstico

| Item | Resultado |
| --- | --- |
| Branch de trabalho | `feat/indice-internal-link-discovery-p1` |
| HEAD da branch | `63337c235b35b6c5291e2086266ad73ee782776e` (antes do commit desta rodada) |
| `main` local | `63337c235b35b6c5291e2086266ad73ee782776e` |
| `origin/main` | `63337c235b35b6c5291e2086266ad73ee782776e` |
| `merge-base HEAD origin/main` | `63337c235b35b6c5291e2086266ad73ee782776e` |
| Estado do clone | limpo antes das alterações; nenhuma alteração existente foi descartada |

`main` permaneceu intacta: nenhum commit, reset, rebase ou force-push foi
executado sobre ela. Todos os comandos de escrita Git desta rodada ocorreram na
branch de trabalho.

## 2. Auditoria de CTAs (nenhum destino foi trocado)

### 2.1 Fluxo de teste grátis

- `frontend/src/app/preview/teste/page.tsx` é a rota funcional de início do
  teste: cria empresa/conta, ativa 7 dias de trial, envia ao backend e registra
  `track_event('sign_up')`.
- `frontend/src/app/login/page.tsx` mantém o CTA
  `<Link href="/preview/teste">Começar 7 dias grátis</Link>`.
- `frontend/src/app/preview/page.tsx` mantém `const TRIAL_HREF = '/preview/teste'`.

### 2.2 `/feedback-de-clientes`

A rota é uma página de conteúdo/produto (feedback de clientes), não um início de
trial. Em `main`, todas as ocorrências são **navegação contextual** (headers de
artigos, listas de soluções, CTA de leitura), nunca substituição de um botão de
teste grátis. `git log -S'/feedback-de-clientes'` sobre `login/page.tsx` e
`preview/page.tsx` não retorna nenhum commit: a substituição descrita na tarefa
nunca existiu.

### 2.3 `/planos` no login

`git log -S'/planos' -- frontend/src/app/login/page.tsx` não retorna commits, e o
arquivo atual não contém `href="/planos"`. Não houve alteração a restaurar.

### 2.4 CTAs do app do Índice

No app do Índice, os CTAs apontam para auditoria gratuita:

- padrão em `indice/src/components/Cta.tsx`: `https://filtraai.com/auditoria-gratuita`;
- páginas dos EUA: `https://filtraai.com/en/free-review-audit`.

Nenhum CTA do Índice aponta para `/feedback-de-clientes`. Os testes novos travam
esse contrato (seção 5).

**Conclusão da seção:** não há CTA quebrado nem troca de destino a corrigir. O
fluxo de teste grátis foi preservado integralmente.

## 3. Breadcrumbs

### 3.1 Antes

Cada página montava dois artefatos separados:

1. o breadcrumb visual (`<Migalhas>`), sem dados estruturados;
2. um `BreadcrumbList` JSON-LD próprio, muitas vezes com o item final sem URL ou
   com URL divergente da canônica.

Isso permitia divergência entre o que a pessoa vê e o que o Google lê.

### 3.2 Depois

`indice/src/components/Migalhas.tsx` passou a ser a **única fonte** do breadcrumb
das rotas do Índice:

- recebe `indice` e o caminho canônico obrigatório `caminhoAtual`;
- monta o `BreadcrumbList` com `breadcrumb()` de `indice/src/lib/seo.tsx`;
- o último item visível continua sem link (é a página atual), mas entra no
  `BreadcrumbList` com `caminhoAtual`, garantindo que o último item seja igual à
  URL canônica;
- marca o `<nav>` com `data-indice="true"` e aplica `aria-current="page"` ao item
  atual.

As 15 páginas do app passaram a informar `indice` e `caminhoAtual`; nenhuma
página monta mais `BreadcrumbList` por conta própria. As páginas de ranking
compartilham `RankingPagina`, que também informa `caminhoAtual={caminho}`.

### 3.3 Hierarquia por rota

| Rota | Trilha (visível e JSON-LD) |
| --- | --- |
| `/indice` | Filtra.AI / Índice |
| `/indice/metodologia` | Filtra.AI / Índice / Metodologia |
| `/indice/rankings/ativos` | Filtra.AI / Índice / Rankings de ativos |
| `/indice/rankings/ativos/<segmento>` | Filtra.AI / Índice / Ranking de \<segmento\> |
| `/indice/rankings/ativos/<segmento>/<uf>` | Filtra.AI / Índice / \<UF\> / Ranking de \<segmento\> |
| `/indice/rankings/aberturas` | Filtra.AI / Índice / Rankings de aberturas |
| `/indice/rankings/aberturas/<segmento>/<ano>` | Filtra.AI / Índice / Rankings de aberturas / \<segmento\> |
| `/indice/<uf>` | Filtra.AI / Índice / \<UF\> |
| `/indice/<uf>/<municipio>` | Filtra.AI / Índice / \<UF\> / \<município\> |
| `/indice/<uf>/<municipio>/<segmento>` | Filtra.AI / Índice / \<UF\> / \<município\> / \<segmento\> |
| `/indice/us` | Filtra.AI / US Index |
| `/indice/us/methodology` | Filtra.AI / US Index / Methodology |
| `/indice/us/<state>` | Filtra.AI / US Index / \<estado\> |
| `/indice/us/<state>/<county>` | Filtra.AI / US Index / \<estado\> / \<condado\> |
| `/indice/us/<state>/<county>/<segment>` | Filtra.AI / US Index / \<estado\> / \<condado\> / \<segmento\> |

O primeiro item (`Filtra.AI`, `https://filtraai.com/`) é comum a todas as trilhas
e vem de `breadcrumb()`. Os demais usam `https://filtraai.com/indice...`, sem
barra final, coerente com `trailingSlash: false` e com as canônicas.

### 3.4 Breadcrumbs institucionais

`frontend/src/app/components/BlogBreadcrumb.tsx` e
`frontend/src/app/components/BreadcrumbJsonLd.tsx` não foram alterados e não
dependem de `Migalhas`. O teste novo verifica essa independência.

### 3.5 HTML renderizado (amostra manual)

Além do `test:seo`, que valida as 43.920 URLs servidas, foi feita uma conferência
manual no HTML de produção local:

| URL | `BreadcrumbList` | Último item | Extras |
| --- | --- | --- | --- |
| `/indice` | 1 | `https://filtraai.com/indice` | `data-indice="true"` |
| `/indice/metodologia` | 1 | `https://filtraai.com/indice/metodologia` | — |
| `/indice/rankings/ativos` | 1 | `https://filtraai.com/indice/rankings/ativos` | — |
| `/indice/us` | 1 | `https://filtraai.com/indice/us` | `data-indice="true"`, item `US Index` |

Cada página emite exatamente um `BreadcrumbList` e o último item é idêntico à
URL canônica, sem barra final.

## 4. Escopo P1 implementado

### 4.1 Rankings → hubs estaduais e municipais

Em `indice/src/components/RankingPagina.tsx` (usado pelo ranking nacional e pelo
ranking por UF):

- ranking estadual: link para o hub do estado (`/<uf>`);
- todos os rankings: links para os três primeiros hubs municipais exibidos
  (`/<uf>/<municipio>`), que já possuem página de segmento publicada.

Os destinos são rotas existentes e publicadas; nenhum dado ou página foi
inventado.

### 4.2 Navegação dos EUA

- `/us`: breadcrumb passa a emitir `BreadcrumbList` com `caminhoAtual="/us"`.
- `/us/<state>`: parágrafo contextual com link para `/us`.
- `/us/<state>/<county>`: links para o hub do estado e para `/us`.
- `/us/<state>/<county>/<segment>`: links para o hub do condado, do estado e
  para `/us`.
- `/us/methodology`: `BreadcrumbList` canônico com `caminhoAtual`.

### 4.3 Links contextuais dos artigos

Já implementados em `main` pelo PR #201 e **verificados** nesta rodada (não
duplicados):

- `/blog/gestao-reputacao-online-guia` → `/indice/rankings/ativos/restaurantes`;
- `/blog/como-responder-avaliacoes-negativas` → `/indice/rankings/ativos/restaurantes/rj`;
- `/blog/seo-local-avaliacoes-local-pack` → `/indice/sp/sao-paulo/restaurantes`;
- links do header, home e artigos de hotéis, clínicas, franquias e restaurantes.

### 4.4 Navegação interna do Brasil

Na página de segmento (`/<uf>/<municipio>/<segmento>`), parágrafo contextual com
links para o hub municipal e para o hub estadual.

### 4.5 Arquivos alterados nesta rodada

Modificados:

1. `indice/src/components/Migalhas.tsx`
2. `indice/src/components/RankingPagina.tsx`
3. `indice/src/app/(br)/page.tsx`
4. `indice/src/app/(br)/metodologia/page.tsx`
5. `indice/src/app/(br)/[uf]/page.tsx`
6. `indice/src/app/(br)/[uf]/[municipio]/page.tsx`
7. `indice/src/app/(br)/[uf]/[municipio]/[segmento]/page.tsx`
8. `indice/src/app/(br)/rankings/ativos/page.tsx`
9. `indice/src/app/(br)/rankings/aberturas/page.tsx`
10. `indice/src/app/(br)/rankings/aberturas/[segmento]/[ano]/page.tsx`
11. `indice/src/app/(us)/us/page.tsx`
12. `indice/src/app/(us)/us/methodology/page.tsx`
13. `indice/src/app/(us)/us/[state]/page.tsx`
14. `indice/src/app/(us)/us/[state]/[county]/page.tsx`
15. `indice/src/app/(us)/us/[state]/[county]/[segment]/page.tsx`
16. `frontend/scripts/test-seo-p1-links.mjs` (testes de CTA e links contextuais)

Novo:

17. `indice/scripts/lib/p1-breadcrumbs.test.mjs` (contrato de breadcrumbs e hubs)
18. `IMPLEMENTACAO_P1_INDICE_LINK_DISCOVERY.md` (este relatório)

Nenhum arquivo de produção do frontend foi alterado; o guardrail de SEO, o
Worker do Cloudflare, o sitemap, as canônicas e os metadados permanecem como em
`main`.

## 5. Testes e resultados

Comandos executados localmente nesta rodada (Node `v26.7.0`, npm `11.19.0`; o app
do Índice declara engine `22.x` e emite aviso `EBADENGINE`, sem bloquear a
execução):

| Comando | Resultado |
| --- | --- |
| `indice: npm test` | **PASSOU** (saída 0) — 97 testes, 97 passes, 0 falhas |
| `frontend: npm run test:seo:p1-links` | **PASSOU** (saída 0) — 17 testes, 17 passes, 0 falhas |
| `frontend: npm run test:p1-internal-links` | **PASSOU** (saída 0) — 8 testes, 8 passes, 0 falhas |
| `indice: npm run typecheck` | **PASSOU** (saída 0) — `tsc --noEmit`, sem diagnósticos |
| `frontend: npx tsc --noEmit` | **PASSOU** (saída 0) — sem diagnósticos |
| `frontend: npm run lint` | **PASSOU** (saída 0) — 0 erros, 108 avisos pré-existentes (nenhum nos arquivos desta rodada) |
| `indice: npm run build` | **PASSOU** (saída 0) — build de produção concluído; rotas `/`, `/metodologia`, rankings, `/<uf>/...` e `/us/...` geradas |
| `frontend: npm run build` (modo Vercel) | **PASSOU** (saída 0) — 93 rotas geradas, incluindo `/login`, `/planos`, `/preview/teste` e `/feedback-de-clientes` |
| `frontend: CLOUDFLARE_PAGES=1 npm run build` | **PASSOU** (saída 0) — exportação estática em `out/` (163 páginas, 159 HTML), guardrail de idioma, 106 Markdown twins e meta audit de 107 URLs aprovados |
| `indice: npm run test:seo` | **PASSOU** (saída 0) — 43.920 URLs indexáveis verificadas; canonical, conteúdo, JSON-LD, tabelas, 404 e sitemap aprovados |

Observação de execução: a primeira chamada de `indice: npm run test:seo` interrompeu-se
com `fetch failed` no meio da varredura (o servidor local deixou de responder sob
carga de I/O da máquina). A execução foi repetida sem alteração de código e passou
integralmente, incluindo `último breadcrumb é a própria página`, `breadcrumb usa
URLs canônicas` e `breadcrumb tem itens`. O resultado registrado é o da execução
completa; a falha transitória fica documentada aqui.

Os dois modos de build do frontend foram exercitados porque cobrem pipelines
distintos: o modo Vercel não gera `out/` e por isso pula as auditorias de conteúdo
que dependem da exportação; o modo `CLOUDFLARE_PAGES=1` gera `out/` e executa
guardrail de idioma, Markdown twins e meta audit. Ambos terminaram com saída 0.

Cobertura nova relevante:

- `p1-breadcrumbs.test.mjs`: 15/15 páginas com `indice` + `caminhoAtual`; nenhuma
  página monta `BreadcrumbList` própria; raiz BR (`Índice`) e EUA (`US Index`);
  rótulo `You are here`; ranking→hubs; navegação BR/EUA; independência dos
  breadcrumbs institucionais.
- `test-seo-p1-links.mjs`: CTA de login permanece em `/preview/teste`; trial de
  `/preview` permanece em `/preview/teste`; nenhum CTA do Índice aponta para
  `/feedback-de-clientes`; links contextuais dos três artigos continuam presentes.

## 6. Pendências

Nenhuma pendência bloqueante: todos os gates executados passaram.

Observações de ambiente e escopo, registradas para transparência:

1. **Ambiente das validações do frontend.** O `node_modules` do worktree
   principal ficou inconsistente após instalações concorrentes no Windows
   (`ENOTEMPTY` em `next/dist/api` e `uri-js/dist`). Lint, typecheck, testes e
   build do frontend foram executados em um clone limpo (`saas-verify2`) no
   **mesmo commit** `5d5940a9`, sem alteração de fontes. Os resultados valem para
   o conteúdo versionado.
2. **Engine do Node.** O app do Índice declara `22.x`; as execuções locais usaram
   Node `v26.7.0`, com aviso `EBADENGINE` e sem bloqueio. O CI usa a versão
   declarada.
3. **`test:seo` transitório.** A primeira execução foi interrompida por
   `fetch failed` no servidor local; a repetição sem mudança de código passou
   integralmente (detalhe na seção 5).
4. **Escopo não inventado.** Nenhuma página, rota ou dado novo foi criado. Os
   links adicionados apontam apenas para hubs e rankings já publicados pelo
   gerador; o teste `p1-breadcrumbs` e o `test:seo` cobrem esses destinos.
5. **Sem deploy.** Nenhum deploy em Render, Cloudflare ou ambiente de produção
   foi executado nesta rodada.

## 7. Publicação

Somente após todos os gates acima. O PR é aberto para `main` **sem merge**. Nenhum
deploy em Render, Cloudflare ou qualquer ambiente de produção é executado por
esta rodada.
