# FILTRA.AI — Continuidade da Auditoria DSV4: P0 (Indexação/Search Console) + P1 (Arquitetura de Links Internos)

**Objetivo:** concluir o diagnóstico P0 de indexação e preparar uma proposta técnica concreta para P1: aprimoramento dos links internos entre artigos e páginas prioritárias do Índice.
**Repositório:** `LU9DI/saas-reputacao-ia` — `/workspace`
**Propriedade analisada:** `sc-domain:filtraai.com`
**Modo de execução:** exclusivamente leitura. Nenhum arquivo do repositório foi alterado; nenhum commit, push, merge, tag ou deploy; nenhuma mudança de DNS/Cloudflare/Render/Supabase; nenhuma solicitação de indexação em massa; nenhuma contratação de plano.

> **Regra de evidência:** FATO (verificado via GSC, HTTP de produção ou código do repositório), HIPÓTESE (indício sem prova definitiva) ou SEM ACESSO (não pôde ser verificado). Nenhuma métrica foi inventada. Nenhum número do Search Console foi estimado.

---

## 1. Estado Git inicial e final

| Item | Valor |
|---|---|
| Caminho absoluto do repositório | `/workspace` |
| Branch atual | `main` |
| HEAD / último commit | `9be7edaba9a4af2107a480a476247ff9f5cacf32` — Merge pull request #200 from LU9DI/seo/aeo-geo-scope-consistency |
| `git status --short` | vazio (working tree limpo) |
| Alterações staged | nenhuma |
| Alterações unstaged | nenhuma |
| Arquivos untracked | nenhum |
| Últimos 5 commits | `9be7edab` (merge PR #200), `4e5adc5d` (docs AEO/GEO), `b84e7d9e` (FAQPage /filtra-ai), `634465f5` (test scope guardrail), `dde9aa56` (fix structured/social metadata) |

**PR #199 e commit `61e0df5b24f3b003fb23142d744cf056ba083fb`:**
- O commit `61e0df5b` ("seo(links): add 4 P1 internal links to blog articles") está presente no histórico de `main` e foi mergeado via PR #200 (commit `9be7edab`). Não existe branch separada do PR #199 no repositório local; as alterações já estão incorporadas ao `main`.
- Conteúdo do commit: 4 links internos em 3 artigos (`gestao-reputacao-online-guia`, `qr-code-balcao-reviews`, `review-1-estrela-primeiras-24-horas`) → destinos (`como-responder-avaliacoes-negativas`, `qr-code-balcao-reviews`, `feedback-de-clientes` x2), registrados em `docs/CHANGELOG-LINKS-INTERNOS.md`. Nenhuma página `/indice/*` foi alterada.

**PR #200 e commit `9be7edaba9a4af2107a480a476247ff9f5cacf32`:**
- Commit de merge do PR #200 ("seo/aeo-geo-scope-consistency"), que incorpora o PR #199 entre outros. É o HEAD atual da branch `main`.

**Relatório anterior:** `AUDITORIA_DSV4_FILTRAAI.md` está em `/tmp/AUDITORIA_DSV4_FILTRAAI.md` (publicado como artefato). Usado como referência desta continuidade.

**Estado final do Git:** confirmado limpo, idêntico ao inicial (`9be7edab`, working tree limpo). Nenhum arquivo foi adicionado, removido ou modificado.

---

## 2. Dados GSC disponíveis (consultados nesta sessão)

Todos os dados abaixo vêm da propriedade `sc-domain:filtraai.com` (permissão siteOwner), via API do Search Console (conexão previamente autorizada, session `bean`). Nenhum dado foi inventado.

### 2.1 Sitemaps (GSC — `GOOGLE_SEARCH_CONSOLE_GET_SITEMAP`)

| Sitemap | Submetidas | Indexadas (campo descontinuado) | Erros | Avisos | Último download pelo Google |
|---|---:|---:|---:|---:|---|
| `https://filtraai.com/sitemap.xml` (institucional) | 107 | 0 | 0 | 0 | 2026-11-07 |
| `https://filtraai.com/indice/sitemap-index.xml` (central do Índice) | 43.920 | 0 | 0 | 0 | 2026-11-08 |
| `.../indice/sitemap/0.xml` | 10.000 | 0 | 0 | 0 | 2026-11-05 |
| `.../indice/sitemap/1.xml` | 10.000 | 0 | 0 | 0 | 2026-11-04 |
| `.../indice/sitemap/2.xml` | 10.000 | 0 | 0 | 0 | 2026-11-06 |
| `.../indice/sitemap/3.xml` | 10.000 | 0 | 0 | 0 | 2026-11-08 |
| `.../indice/sitemap/4.xml` | 3.920 | 0 | 0 | 0 | 2026-11-08 |

- **FATO:** O campo `indexed` dos sitemaps do GSC é descontinuado e sempre retorna 0 (documentado no `SEO_INDEXING_RUNBOOK.md`). Não mede indexação real.
- **FATO:** O Google está lendo todos os sitemaps recentemente (downloads entre 04/11 e 08/11/2026), sem erros nem avisos.
- **FATO:** Os números de submetido batem com o gerador de sitemaps do repositório (28.853 BR + 15.067 US = 43.920).

### 2.2 Search Analytics — 90 dias (2026-08-10 → 2026-11-05), domínio inteiro

| Métrica | Valor |
|---|---:|
| Cliques | 14 |
| Impressões | 976 |
| CTR | 1,43% |
| Posição média | 30,97 |

### 2.3 Evolução temporal (impressões/cliques por dia, 90 dias)

| Data | Cliques | Impressões | Posição |
|---|---:|---:|---:|
| 2026-09-29 | 0 | 3 | 1,67 |
| 2026-09-30 | 0 | 6 | 2,33 |
| ... | ... | ... | ... |
| 2026-10-06 | 1 | 10 | 11,10 |
| 2026-10-14 | 1 | 11 | 18,18 |
| 2026-10-21 | 1 | 24 | 57,08 |
| 2026-10-27 | 0 | 18 | 26,22 |
| 2026-10-31 | 0 | 31 | 18,32 |
| 2026-11-01 | 0 | 42 | 22,64 |
| 2026-11-02 | 0 | 44 | 20,95 |
| 2026-11-03 | 1 | 95 | 21,03 |
| 2026-11-04 | 5 | 184 | 19,98 |
| 2026-11-05 | 5 | 209 | 17,74 |

**Interpretação:** presença de busca começa a partir de ~29/09/2026. Crescimento expressivo de impressões a partir de 31/10 e cliques a partir de 03/11, com pico nos últimos 2 dias (04–05/11): 10 cliques / 393 impressões. É correlação temporal, não evidência causal de qualquer mudança específica (datas dos deploys não verificáveis a partir do repositório).

### 2.4 Períodos equivalentes de comparação

| Período | Cliques | Impressões | CTR | Posição média |
|---|---:|---:|---:|---:|
| 90 dias (10/08–05/11) | 14 | 976 | 1,43% | 30,97 |
| 90 dias anterior (12/05–09/08) | 0 (sem dados) | 0 | — | — |
| 28 dias (09/10–05/11) | 13 | 932 | 1,39% | 31,23 |
| 28 dias anterior (11/09–08/10) | 1 | 44 | 2,27% | 25,45 |
| 7 dias (29/10–05/11) | 11 | 632 | 1,74% | 19,93 |
| 7 dias anterior (22/10–28/10) | 0 | 147 | 0% | 54,81 |

### 2.5 Páginas com impressões (90 dias) — detalhamento extraído do GSC

Páginas do **Índice** com ≥1 impressão (amostra do resultado completo; total de 356 páginas do Índice com qualquer impressão, ≈0,8% de 43.920):

| Página | Grupo | Cliques | Impressões | CTR | Posição média |
|---|---|---:|---:|---:|---:|
| `/indice/us/north-carolina/pasquotank-county/restaurants-and-bars` | célula EUA | 1 | 13 | 7,69% | 7,62 |
| `/indice/am/itacoatiara/supermercados` | célula BR | 0 | 11 | 0% | 12,00 |
| `/indice/ba/feira-de-santana/restaurantes` | célula BR | 0 | 10 | 0% | 3,50 |
| `/indice/us/north-carolina/durham-county` | município EUA | 0 | 8 | 0% | 59,75 |
| `/indice/us/north-carolina/new-hanover-county` | município EUA | 0 | 8 | 0% | 5,00 |
| `/indice/df/brasilia/supermercados` | célula BR | 0 | 8 | 0% | 8,63 |
| `/indice/am/manaus/supermercados` | célula BR | 0 | 7 | 0% | 5,86 |
| `/indice/sp/sao-jose-do-rio-preto/saloes-de-beleza` | célula BR | 1 | 5 | 20% | 6,40 |
| `/indice/rankings/ativos/saloes-de-beleza` | ranking nacional | 1 | 5 | 20% | 21,20 |
| `/indice/sp/sao-paulo/restaurantes` | célula BR | 0 | 14 | 0% | 3,29 |
| `/indice/rankings/ativos/restaurantes` | ranking nacional | 0 | 13 | 0% | 3,46 |
| `/indice/rankings/ativos/restaurantes/rj` | ranking estadual | 0 | 9 | 0% | 6,22 |
| `/indice/rankings/ativos/restaurantes/go` | ranking estadual | 0 | 7 | 0% | 7,00 |
| `/indice/rankings/ativos/restaurantes/es` | ranking estadual | 0 | 9 | 0% | 6,67 |
| `/indice/rankings/ativos/supermercados/mt` | ranking estadual | 0 | 5 | 0% | 5,20 |
| `/indice/sp/mariapolis` | município BR | 0 | 5 | 0% | 7,20 |
| `/indice/rj` | UF BR | 0 | 6 | 0% | 6,00 |
| `/indice/us/indiana/marion-county` | condado EUA | 1 | 4 | 25% | 5,75 |
| `/indice/us/indiana/marion-county/restaurants-and-bars` | célula EUA | 1 | 4 | 25% | 6,25 |
| `/indice/us/indiana/porter-county/medical-and-dental-offices` | célula EUA | 0 | 2 | 0% | 1,00 |
| `/indice/us/indiana/tippecanoe-county` | condado EUA | 0 | 1 | 0% | 1,00 |
| `/indice/us/hawaii/kauai-county` | condado EUA | 0 | 1 | 0% | 1,00 |

Páginas **não-Índice** com impressões (90 dias):

| Página | Grupo | Cliques | Impressões | CTR | Posição média |
|---|---|---:|---:|---:|---:|
| `https://filtraai.com/` | institucional (home) | 1 | 63 | 1,59% | 6,92 |
| `https://filtraai.com/blog/gestao-reputacao-online-guia` | artigo | 0 | 83 | 0% | 73,84 |
| `https://filtraai.com/blog/seo-local-avaliacoes-local-pack` | artigo | 0 | 23 | 0% | 39,52 |
| `https://filtraai.com/gestao-de-reputacao-online` | comercial | 0 | 84 | 0% | 69,90 |
| `https://filtraai.com/clinicas` | comercial | 0 | 13 | 0% | 37,92 |
| `https://filtraai.com/feedback-de-clientes` | comercial | 0 | 12 | 0% | 7,50 |
| `https://filtraai.com/franquias` | comercial | 0 | 12 | 0% | 3,75 |
| `https://filtraai.com/avaliacoes-google` | comercial | 0 | 10 | 0% | 35,90 |
| `https://filtraai.com/associacoes` | comercial | 0 | 10 | 0% | 6,70 |
| `https://filtraai.com/agencias` | comercial | 0 | 12 | 0% | 9,67 |
| `https://filtraai.com/auditoria-gratuita` | comercial | 0 | 5 | 0% | 7,20 |
| `https://filtraai.com/calculadora-nota-google` | comercial | 0 | 4 | 0% | 8,25 |

### 2.6 Por país (90 dias)

| País | Cliques | Impressões | Posição média |
|---|---:|---:|---:|
| USA | 8 | 390 | 19,60 |
| BRA | 4 | 324 | 26,41 |
| PRT | 0 | 103 | 65,17 |
| ESP | 0 | 55 | 57,75 |
| Outros (~30 países) | 2 | ~100 | 20–99 |

---

## 3. Dados GSC ausentes e instruções de exportação

Os seguintes relatórios **não estão disponíveis** via ferramentas utilizadas (não há API de Cobertura de Indexação / Page Indexing nas integrações conectadas; o campo `indexed` dos sitemaps é descontinuado; cota da URL Inspection limitada a amostras):

1. **Indexação > Páginas:** total de URLs indexadas vs não indexadas; motivos de exclusão (Descoberta — atualmente não indexada, Rastreada — atualmente não indexada, 404, 5xx, bloquedo por robots, noindex, duplicada, canonical alternativa, canonical selecionada pelo Google); evolução temporal das categorias.
2. **Indexação > Sitemaps:** URLs indexadas por sitemap (o campo disponível é sempre 0); comparação submetido vs descoberto vs indexado por arquivo.
3. **URL Inspection:** inspeção em amostra estratificada maior que 10 URLs (cota respeitada).
4. **Desempenho:** consultas detalhadas além do top 100 retornado; dispositivos; tipos de pesquisa; além de 1000 linhas por página.

**Instruções para exportação manual do Google Search Console (propriedade `sc-domain:filtraai.com`):**

1. **Indexação > Páginas:** abrir o relatório "Páginas", exportar (ícone de exportar → CSV/Planilhas do Google). Registrar totais de indexadas/não indexadas e cada motivo de exclusão com respectivo número de URLs. Exportar também o histórico temporal (últimos 90 dias, 6 meses, 1 ano).
2. **Indexação > Sitemaps:** abrir cada sitemap (`sitemap.xml`, `sitemap-index.xml`, `indice/sitemap/0.xml`…`4.xml`), anotar URLs submetidas, descobertas, indexadas, última leitura e erros.
3. **Desempenho > Resultados da pesquisa:** selecionar período 90 dias (e períodos equivalentes anteriores), exportar por **Página** e por **Consulta** (filtros: país, dispositivo, tipo de pesquisa). Registrar cliques, impressões, CTR, posição média.
4. **Inspeção de URL:** inspecionar amostra estratificada: home do Índice, metodologia, ranking nacional, UF, município, célula BR, estado EUA, condado EUA, célula EUA; registrar `coverageState`, `indexingState`, `lastCrawlTime`, `pageFetchState`, `robotsTxtState`, `googleCanonical`, `userCanonical`.

**Declaração:** o P0 **não está concluído** enquanto esses dados não forem obtidos. Os achados desta continuidade são baseados nos dados disponíveis (sitemaps, search analytics por página/data/país, 10 inspeções de URL).

---

## 4. Diagnóstico de indexação (P0)

**Causa raiz confirmada (FATO):** o Google **não está indexando a esmagadora maioria das 43.920 URLs do Índice**. Evidências:
- Amostra de 10 URL Inspections: 4 indexadas, 6 "URL is unknown to Google" — incluindo **todas as 5 amostras dos EUA** (estado, condado, célula) e os hubs `/indice/sp` e `/indice/sp/sao-paulo`.
- Apenas 356 de 43.920 páginas do Índice (≈0,8%) receberam qualquer impressão em 90 dias.
- Sitemaps estão sendo lidos sem erros (downloads recentes 04–08/11), então o problema não é submissão nem bloqueio (`robots.txt` permite `Allow: /`).

**Hipóteses (não confirmadas):** hubs de UF/município BR e todo o recorte EUA são "desconhecidos" provavelmente por falta de links internos de páginas já indexadas e dependência exclusiva do sitemap; instabilidade do Render (502/503/failover documentada em `FAILOVER.md`) pode ter afetado rastreamento, mas não há prova de que o Googlebot encontrou 5xx (logs do Render inacessíveis).

**Não classificar como concluído sem:** os dados do relatório de Páginas (motivos de exclusão) e uma inspeção maior de URLs dos EUA e dos hubs BR.

---

## 5. Mapa atual da arquitetura de links (P1 — código atual do repositório)

A seguir, o mapeamento baseado no código atual de `main` (sem alterações).

### 5.1 Hierarquia do Índice Brasil (`indice/src/app/(br)/`)

| Página | Links internos de saída (no HTML) | Recebe links de |
|---|---|---|
| `/` (home Índice) | 27 UFs (`/<uf>`), `/rankings/ativos`, `/rankings/ativos/<seg>`, `/rankings/aberturas/<seg>/<ano>`, top-5 municípios×segmento (`/<uf>/<mun>/<seg>`), `/metodologia` | `/us` (via hub-links, não nesta página) |
| `/[uf]` (estado) | municípios do estado com página (`/<uf>/<mun>`), top-5 municípios×segmento no estado, `/rankings/ativos/<seg>`, `/metodologia` | `/` |
| `/[uf]/[municipio]` (município) | células do município (`/<uf>/<mun>/<seg>`), `/metodologia`, outros segmentos do município | `/[uf]` |
| `/[uf]/[municipio]/[segmento]` (célula) | ranking de aberturas por ano, outros municípios da UF no segmento, outros segmentos do município | `/[uf]/[municipio]`, `/[uf]` (top-5), `/` (top-5) |
| `/rankings/ativos` | `/rankings/ativos/<seg>` (9 segmentos) | `/` |
| `/rankings/ativos/<seg>` | `/rankings/ativos/<seg>/<uf>` (UFs com ≥10 municípios) | `/`, `/[uf]` |
| `/rankings/ativos/<seg>/<uf>` | (nenhuma lista de municípios na rota) | `/rankings/ativos/<seg>` |
| `/rankings/aberturas` | `/rankings/aberturas/<seg>/<ano>` | `/` |
| `/rankings/aberturas/<seg>/<ano>` | (sem links internos adicionais além do breadcrumb) | `/rankings/aberturas` |
| `/metodologia` | nenhum link interno de navegação (apenas breadcrumb) | — |

**Migalhas (Migalhas.tsx):** toda página do Índice exibe breadcrumb iniciando em `<a href="https://filtraai.com/">Filtra.AI</a>` (home institucional, **não** a home do Índice `/`). As páginas do Índice não têm link de volta para `/indice` via breadcrumb.

**Layout BR (`(br)/layout.tsx`):** rodapé com link para `/metodologia`, links externos para `https://filtraai.com/` (home institucional), `/gestao-de-reputacao-online`, `/avaliacoes-google`, `/privacidade`, e link recíproco para `/us` ("Filtra.AI US Index", hrefLang=en). Aparece em TODAS as páginas BR.

**SiteHeader (BR):** links `/` (Início), `/rankings/ativos`, `/metodologia`, `/us` (US Index, hrefLang=en), botão `/auditoria-gratuita`.

### 5.2 Hierarquia do Índice EUA (`indice/src/app/(us)/`)

| Página | Links internos de saída | Recebe links de |
|---|---|---|
| `/us` | estados (`/us/<state>`), `/us/methodology`, top-10 condados×segmento | `/us` (layout US), `/` (link recíproco) |
| `/us/[state]` | condados do estado, `/us/methodology`, top-10 condados×segmento no estado | `/us` |
| `/us/[state]/[county]` | células (`/us/<state>/<county>/<segment>`), `/us/methodology` | `/us/[state]` |
| `/us/[state]/[county]/[segment]` | outros condados do estado no segmento, outras categorias do condado | `/us/<state>/<county]` |

**Layout US (`(us)/layout.tsx`):** navegação com `/us` (Home), `/us/methodology`, **`/` (Índice Brasil, hrefLang=pt-BR)**, botão free-review-audit externo. Rodapé com link recíproco para `/` ("Índice Filtra.AI", hrefLang=pt-BR). Aparece em TODAS as páginas US.

### 5.3 Teste automatizado existente (`indice/scripts/lib/hub-links.test.mjs`)

Verifica:
1. Header BR e layout BR contêm link literal `/us`.
2. Layout US contém link literal `/`.
3. Rótulos dos links cruzados marcados com idioma de destino (hrefLang/lang).
4. Nenhum link literal dos layouts aponta para rota não publicada (prova contra 404).
5. Links cruzados não criam URLs novas/duplicadas; BR e EUA não compartilham caminho.

**Limitação:** o teste cobre apenas layouts/headers, não cobre células, rankings, nem links dos artigos do frontend.

### 5.4 Arquitetura de links dos artigos (frontend) — PR #199

Cada um dos 19 posts do blog contém um **bloco boilerplate quase idêntico** de ~25–30 links internos, incluindo: `/`, `/agencias`, `/analise-de-avaliacoes-com-ia`, `/auditoria-gratuita`, `/avaliacoes-google`, `/blog`, `/calculadora-nota-google`, `/clinicas`, `/como-funciona`, `/feedback-de-clientes`, `/filtra-ai`, `/gestao-de-reputacao-online`, `/indice`, `/indice/rankings/ativos`, `/indice/us`, `/login`, `/planos`, `/restaurantes`, 4–5 posts relacionados fixos (incluindo `/blog/gestao-reputacao-online-guia` em praticamente todos), alternates hreflang (`/en/blog/…`, `/es/blog/…`, `/zh/blog/…`), e **self-link** (o post linka a si mesmo).

**Links adicionados pelo PR #199 (confirmados em produção, HTML bruto):**
1. `/blog/gestao-reputacao-online-guia` → `/blog/como-responder-avaliacoes-negativas` (âncora "Respostas públicas")
2. `/blog/gestao-reputacao-online-guia` → `/blog/qr-code-balcao-reviews` (âncora "link ou QR Code")
3. `/blog/qr-code-balcao-reviews` → `/feedback-de-clientes` (âncora "registrar feedback")
4. `/blog/review-1-estrela-primeiras-24-horas` → `/feedback-de-clientes` (âncora "feedback privado")

**Avaliação:** os links são tecnicamente corretos (HTML bruto, sem `nofollow`, destinos 200 + canonical correta), mas:
- São **boilerplate repetidos** em todos os artigos (baixa relevância contextual).
- Não há **nenhum link dos artigos para células profundas do Índice** (23.566 BR + 15.067 US). Os artigos linkam apenas para `/indice`, `/indice/rankings/ativos` e `/indice/us` (hubs).
- `/preview/teste` e `/teste` (páginas de teste, `noindex, nofollow`) recebem links da homepage e do `/blog` — sumidouro de rastreamento.

### 5.5 Profundidade de clique (cliques a partir da home)

| Tipo de página | Profundidade aproximada | Caminho |
|---|---|---|
| Home institucional `/` | 0 | — |
| Home do Índice `/indice` | 1 | home → `/indice` (via navegador direto; não há link da home institucional para `/indice` observado no header principal do site) |
| UF `/indice/<uf>` | 2 | home → `/indice` → `/<uf>` |
| Município `/indice/<uf>/<mun>` | 3 | … → `/<uf>` → `/<uf>/<mun>` |
| Célula `/indice/<uf>/<mun>/<seg>` | 4 | … → `/<uf>/<mun>` → célula |
| Ranking nacional `/indice/rankings/ativos/<seg>` | 2 | home → `/indice` → ranking |
| Ranking estadual `/indice/rankings/ativos/<seg>/<uf>` | 3 | … → ranking nacional → estadual |
| Artigo do blog | 1–2 | home → `/blog` → artigo |

**Observação:** a home institucional (`/`) não foi observada linkando para `/indice` no HTML capturado (os links da homepage vão para seções internas e posts, não para o hub do Índice). Isso reforça que o Índice depende quase exclusivamente do sitemap para descoberta.

---

## 6. Problemas confirmados e evidências

| # | Problema | Evidência | Gravidade |
|---|---|---|---|
| P0-1 | Google não indexa a esmagadora maioria das 43.920 URLs do Índice | 6/10 inspeções "unknown"; apenas 356/43.920 páginas com impressões | P0 |
| P0-2 | Hubs UF/município BR e todo recorte EUA são "desconhecidos do Google" | Inspeção: `/indice/sp`, `/indice/sp/sao-paulo`, `/indice/us/california` e variantes = unknown | P0 |
| P0-3 | Número exato de URLs indexadas indisponível | Campo `indexed` dos sitemaps = 0 (descontinuado); sem API de Cobertura | P0 (dado ausente) |
| P1-1 | Links dos artigos são boilerplate repetidos (~25–30 links iguais em todos os 19 posts) | Análise do HTML bruto de todos os posts | P1 |
| P1-2 | Zero links dos artigos para células profundas do Índice | Código dos posts: linkam apenas `/indice`, `/indice/rankings/ativos`, `/indice/us` | P1 |
| P1-3 | Home institucional não linka para `/indice` | HTML da homepage capturado: sem link para o hub do Índice | P1 |
| P1-4 | Páginas de teste (`/preview/teste`, `/teste`) recebem links internos mas são `noindex, nofollow` | HTML capturado: linkadas de home e `/blog` | P1 |
| P1-5 | Self-links nos artigos (post linka a si mesmo) | HTML capturado: cada post contém seu próprio href | P1 |
| P1-6 | Migalhas do Índice apontam para home institucional `/`, não para `/indice` | Código `Migalhas.tsx`: primeiro item é `<a href="https://filtraai.com/">` | P1 |

---

## 7. Páginas prioritárias e critérios (P1)

Critérios aplicados aos dados GSC disponíveis (não há dados de páginas do índice além das 356 com impressões; classificação abaixo usa os dados confirmados e é marcada como provisória onde não houver dado).

### A. Prioridade alta (com dados GSC)

| URL | Tipo | Cliques | Imp. | CTR | Posição | Links internos recebidos | Profundidade | Artigos candidatos a origem | Justificativa |
|---|---|---:|---:|---:|---:|---|---|---|---|
| `/indice/sp/sao-paulo/restaurantes` | célula BR | 0 | 14 | 0% | 3,29 | apenas hierarquia (`/indice`, `/indice/sp`) | 4 | artigos sobre restaurantes / SEO local | Posição excelente (3,29) mas 0 cliques; célula de capital com dados reais |
| `/indice/rankings/ativos/restaurantes` | ranking nacional | 0 | 13 | 0% | 3,46 | `/indice`, `/` | 2 | artigos sobre restaurantes | Ranking nacional bem posicionado; porta de entrada para células |
| `/indice/rankings/ativos/restaurantes/rj` | ranking estadual | 0 | 9 | 0% | 6,22 | `/rankings/ativos/restaurantes` | 3 | artigos sobre restaurantes RJ | Posição 6,22 com 9 impressões |
| `/indice/rankings/ativos/restaurantes/go` | ranking estadual | 0 | 7 | 0% | 7,00 | idem | 3 | — | idem |
| `/indice/rankings/ativos/restaurantes/es` | ranking estadual | 0 | 9 | 0% | 6,67 | idem | 3 | — | idem |
| `/indice` (home do Índice) | hub | 0 | 10 | 0% | 2,6 | sitemap (não há link da home institucional) | 1 | homepage institucional | Posição 2,6 (consultas de marca), 0 cliques — não recebe link da home institucional |
| `/blog/gestao-reputacao-online-guia` | artigo | 0 | 83 | 0% | 73,84 | homepage, outros posts | 1–2 | — | 83 impressões mas posição 73,8 (página 8); não recebe clique |
| `/gestao-de-reputacao-online` | comercial | 0 | 84 | 0% | 69,90 | todos os posts (boilerplate) | 1 | — | Página comercial prioritária, 84 impressões, 0 cliques, posição fraca |

### B. Prioridade média (provisória — depende de dados GSC ausentes)

| URL | Tipo | Justificativa |
|---|---|---|
| `/indice/sp`, `/indice/rj`, `/indice/mg` | UFs BR | Hubs de grande volume, desconhecidos do Google (amostra), precisam de links de páginas indexadas |
| `/indice/us/*` (condados/células com impressão) | EUA | Algumas células US têm impressões (ex.: marion-county, pasquotank-county); pais (estado/condado) são desconhecidos |
| `/indice/rankings/ativos/<seg>` (outros 8 segmentos) | ranking nacional | São porta de entrada para células; não aparecem com impressões nos dados disponíveis |

### C. Manter estrutura atual
- Páginas já indexadas com bom desempenho: `/indice/sp/sao-paulo/restaurantes` (indexada via sitemap), `/indice/rankings/ativos/restaurantes`, `/indice/metodologia`.

### D. Investigar antes de qualquer mudança
- Todas as 43.564 URLs do Índice sem impressões (≈99,2%): classificar entre "melhorar conteúdo e indexar" vs "retirar do sitemap/noindex" exige dados de cobertura que não estão disponíveis.

**Declaração:** a classificação de prioridade média é **provisória** porque depende dos dados de cobertura (motivos de exclusão) e de uma inspeção maior de URLs que não estão disponíveis nesta sessão.

---

## 8. Proposta de implementação P1 (links origem → destino)

A proposta abaixo respeita as regras de segurança: **não altera código nesta fase**; é um plano para execução posterior mediante autorização. Prioriza links contextuais naturais, evita boilerplate duplicado, self-links, e links para páginas não publicadas.

### Princípios da proposta
1. Somente links que façam sentido semântico para o leitor.
2. Não adicionar blocos idênticos em todos os artigos.
3. Não criar self-links.
4. Não adicionar centenas de links indiscriminadamente.
5. Não aplicar `noindex`, não remover páginas, não alterar canonical em massa.
6. Preservar os 4 links existentes do PR #199.
7. Preservar a arquitetura hierárquica do Índice (UF → município → célula) e o teste `hub-links.test.mjs`.

### Proposta concreta de links origem → destino

| # | Arquivo de origem | Trecho/componente | URL de destino | Texto âncora sugerido | Justificativa semântica | Relevância para o leitor | Impacto esperado | Risco de repetição/excesso | Teste automatizado correspondente |
|---|---|---|---|---|---|---|---|---|---|
| P1-1 | `frontend/src/app/layout.tsx` (header institucional) | navegação principal | `https://filtraai.com/indice` | "Índice de empresas por município" | Conecta o site institucional ao hub do Índice, que hoje não recebe link da home institucional | O visitante do site principal descobre o Índice | Melhora descoberta do hub `/indice` (posição 2,6, 0 cliques) | Baixo (1 link) | HTML bruto da homepage contém href `/indice`; destino 200 |
| P1-2 | `frontend/src/app/page.tsx` (home institucional) | seção de conteúdo relevante | `https://filtraai.com/indice/rankings/ativos/restaurantes` | "ranking de restaurantes por município" | Contexto de reputação local → dados reais de estabelecimentos | Leitor que pesquisa restaurantes vê dados concretos | Dá entrada de rastreamento ao ranking nacional | Baixo | Destino 200; canonical correta; não é self-link |
| P1-3 | `frontend/src/app/blog/gestao-reputacao-online-guia/page.tsx` | corpo do artigo, seção sobre negócios locais | `https://filtraai.com/indice/rankings/ativos/restaurantes` | "ranking nacional de restaurantes" | Artigo fala de resposta a avaliações; ranking de restaurantes é dados relacionados | Leitor encontra onde seus concorrentes estão | Contexto entre artigo e Índice | Baixo (1 link, não duplica o boilerplate existente) | HTML bruto contém o href; destino 200; preserva links do PR #199 |
| P1-4 | `frontend/src/app/blog/seo-local-avaliacoes-local-pack/page.tsx` | corpo do artigo | `https://filtraai.com/indice/sp/sao-paulo/restaurantes` | "restaurantes ativos em São Paulo" | Artivo sobre SEO local e avaliações Google; célula de São Paulo é exemplo de dados locais | Leitor de SP encontra dados do próprio município | Primeira ligação artigo → célula profunda | Baixo (1 link contextual) | Destino 200 (verificado); não é self-link |
| P1-5 | `frontend/src/app/blog/qr-code-balcao-reviews/page.tsx` | corpo do artigo (já tem link para /feedback-de-clientes do PR #199) | `https://filtraai.com/indice/rankings/ativos/restaurantes` | "onde ficam os restaurantes avaliados" | QR Code no balcão → avaliações → ranking de restaurantes | Jornada completa do lojista | Reforça o destino já indexado | Baixo | Preserva link do PR #199; adiciona 1 link contextual |
| P1-6 | `frontend/src/app/blog/como-responder-avaliacoes-negativas/page.tsx` | corpo do artigo | `https://filtraai.com/indice/rankings/ativos/restaurantes/rj` | "restaurantes do Rio de Janeiro" | Artigo sobre resposta a avaliações; destino é exemplo de segmento/estado | Leitor do setor alimentício no RJ | Primeira ligação para ranking estadual | Baixo | Destino 200 (dados do GSC mostram a página com impressões) |
| P1-7 | `frontend/src/app/(br)/layout.tsx` (rodapé do Índice) | já tem link para `/us`; manter | — | — | — | — | — | — | Teste `hub-links.test.mjs` já cobre |
| P1-8 | `frontend/src/app/blog/*/page.tsx` (todos os 19 posts) | remover self-link (link do post para si mesmo) | — | — | Elimina link autorreferencial desnecessário | — | Limpeza de rastreamento | Baixo (remoção) | Teste: nenhum artigo contém seu próprio href |

**Links NÃO propostos (evitar):**
- Blocos idênticos de links de índice em todos os artigos (violaria "sem repetição excessiva").
- Links para `/preview/teste` ou `/teste` (páginas `noindex`).
- Links para células dos EUA sem dados de demanda (sem evidência de busca).
- Âncoras com excesso de palavras-chave.

---

## 9. Testes necessários (P1)

Descrever, sem executar alterações de código:

1. **Presença no HTML bruto:** cada link proposto aparece como `<a href="...">` no HTML servido (Next.js RSC), não apenas em renderização client-side.
2. **Destinos HTTP 200:** todas as URLs de destino retornam 200 em produção.
3. **Canonical correta:** cada destino tem `<link rel="canonical" href="<própria URL>">`.
4. **Ausência de nofollow indevido:** nenhum link interno proposto tem `rel="nofollow"`.
5. **Ausência de links para URLs inexistentes:** nenhum href aponta para rota que retorne 404 (reutilizar lógica de `hub-links.test.mjs` estendida a artigos).
6. **Texto âncora coerente:** âncora descreve o destino (sem âncoras genéricas tipo "clique aqui").
7. **Ausência de self-links:** nenhum artigo linka para sua própria URL.
8. **Limite razoável de links por artigo:** máximo definido (ex.: ≤ 4 links contextuais adicionais além do boilerplate existente).
9. **Ausência de repetição excessiva:** os novos links contextuais não são idênticos em todos os artigos.
10. **Preservação dos links do PR #199:** os 4 links adicionados continuam presentes.
11. **Preservação da hierarquia do Índice:** links UF → município → célula mantidos; nenhum link aponta para rota não publicada pelo gerador de sitemaps.
12. **Integridade dos 5 shards do sitemap:** `npm run sitemaps:static:check` continua passando (não há mudança de URLs).

Testes existentes que podem ser executados sem alterar código: `indice/scripts/lib/hub-links.test.mjs` (via `npm test` no diretório `indice`, se as dependências estiverem instaladas).

---

## 10. Riscos e medidas de prevenção

| Risco | Medida de prevenção |
|---|---|
| Adicionar links que o Google interprete como manipulação | Links apenas contextuais e semânticos; nenhum bloco idêntico em todos os artigos |
| Quebrar links existentes do PR #199 | Teste de regressão: verificar os 4 links após qualquer edição |
| Criar self-links acidentalmente | Teste automatizado de ausência de self-link por artigo |
| Linkar para páginas não publicadas / 404 | Validar hrefs contra o conjunto de rotas publicadas (mesma lógica de `hub-links.test.mjs`) |
| Alterar canonicamente ou aplicar noindex por engano | Escopo da proposta exclui expressamente `noindex`, remoção e mudança de canonical |
| Afetar negativamente páginas já indexadas | Links são adicionitivos (não removem links existentes); validar com inspeção de URL após deploy |

---

## 11. Plano de execução em etapas (P1)

**Etapa 1 — Validação prévia (sem código):**
- Obter dados de cobertura do GSC (relatório Páginas) para confirmar quais URLs do Índice estão excluídas e por qual motivo.
- Inspecionar mais URLs dos EUA e hubs BR para confirmar o padrão "desconhecido".

**Etapa 2 — Links de alto impacto, baixo risco:**
- P1-1: link da home institucional para `/indice`.
- P1-2: link da home institucional para `/indice/rankings/ativos/restaurantes`.
- Executar testes da seção 9; inspecionar URL dos destinos.

**Etapa 3 — Links contextuais entre artigos e Índice:**
- P1-3 a P1-6: links contextuais em artigos selecionados.
- Verificar preservação dos 4 links do PR #199.

**Etapa 4 — Limpeza:**
- P1-8: remover self-links dos artigos (se confirmados no código atual).

**Etapa 5 — Monitoramento:**
- Acompanhar Page Indexing e URL Inspection a cada 14 dias; avaliar impressões/cliques após 28–60 dias sem atribuir causalidade imediata.

---

## 12. Pendências que dependem de acesso externo

- Dados do relatório **Indexação > Páginas** (totais de indexadas/não indexadas, motivos de exclusão, evolução temporal) — não disponível via ferramentas conectadas.
- **URL Inspection** em amostra maior que 10 URLs — cota da API respeitada.
- **Logs do Render** (instabilidade 502/503/failover) — inacessíveis nesta sessão.
- **Data exata do deploy da produção** (PR #199/PR #200) — não verificável a partir do repositório; impede atribuição causal de variações de tráfego.

---

## 13. Declaração de integridade

- Nenhum arquivo do repositório `/workspace` foi alterado, adicionado ou removido.
- `git status --short` está vazio; o HEAD permanece em `9be7edab` (merge PR #200).
- Nenhum commit, push, merge, tag ou deploy foi executado.
- Nenhuma mudança de DNS, Cloudflare, Render ou Supabase foi feita.
- Nenhuma solicitação de indexação em massa foi submetida ao Google Search Console.
- Nenhum plano foi contratado nem conta desconectada.
- Nenhum código de produção foi modificado nesta fase.
- O relatório está salvo em `/tmp/AUDITORIA_P0_P1_CONTINUIDADE_FILTRAAI.md`.

**Aguardando autorização expressa para iniciar a implementação das alterações P1.** Nenhuma alteração será feita sem essa autorização.