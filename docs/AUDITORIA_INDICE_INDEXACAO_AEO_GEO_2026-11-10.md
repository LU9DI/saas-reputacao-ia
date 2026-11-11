# Auditoria do Índice Filtra.AI — indexação, AEO e GEO (2026-11-10)

**Escopo:** 43.920 URLs do Índice (`filtraai.com/indice`), Brasil e EUA.
**Natureza:** auditoria técnica independente, com uma correção comprovada de links internos.
**Ambiente:** clone local, branch `audit/indice-indexacao-aeo-geo`, criada a partir de `origin/main` em `33343e0384672ef6aa3c4b53d81674febccc7297`.
**Produção:** nenhum deploy, nenhuma alteração de configuração do Render/Cloudflare e nenhuma escrita no Google Search Console foram executados.

Este documento separa **medido**, **histórico** e **não medido**. URLs no sitemap não são URLs indexadas: a contagem de indexação depende do relatório *Indexação de páginas* do Search Console, que não esteve acessível nesta sessão.

---

## 1. Estado do Git e integração do PR #204

| Verificação | Resultado | Evidência |
|---|---|---|
| Branch da auditoria | `audit/indice-indexacao-aeo-geo` | `git branch --list` |
| HEAD local | `33343e0384672ef6aa3c4b53d81674febccc7297` | `git rev-parse HEAD` |
| `origin/main` | `33343e0384672ef6aa3c4b53d81674febccc7297` | `git rev-parse origin/main` |
| PR #204 integrado | **SIM**, por squash | `33343e03 ... SEO P1: breadcrumbs canônicos e navegação por hubs no Índice`, pai `63337c23` |
| Branch original preservada | **SIM** | `feat/indice-internal-link-discovery-p1` continua local |
| Conteúdo da branch = squash | **SIM** | `git diff --stat 33343e03 feat/indice-internal-link-discovery-p1` vazio (exit 0) |
| Worktree | um único worktree no commit base | `git worktree list` |
| Alterações locais descartadas | **NENHUMA** | não houve `reset`, `checkout --`, `clean` nem stash |

A auditoria começou com a árvore limpa e criou uma branch própria antes de qualquer edição.

---

## 2. Inventário e classificação das URLs

### 2.1 Sitemap central e filhos (baixados de produção)

| Artefato | URLs | Situação |
|---|---:|---|
| `sitemap-index.xml` | 6 filhos | índice central válido |
| `sitemap.xml` (site principal) | 107 | leaf do site principal |
| `sitemap/0.xml` | 10.000 | 100% Brasil |
| `sitemap/1.xml` | 10.000 | 100% Brasil |
| `sitemap/2.xml` | 10.000 | 8.853 Brasil + 1.147 EUA |
| `sitemap/3.xml` | 10.000 | 100% EUA |
| `sitemap/4.xml` | 3.920 | 100% EUA |
| `sitemap/5.xml` | — | 404, correto |
| **Total do Índice** | **43.920** | **28.853 Brasil + 15.067 EUA** |

Integridade do conjunto: **43.920 `<loc>` únicos, 0 duplicatas, 0 parâmetros, 0 fragmentos, 0 barras finais, 0 URLs em `http://`, 0 em `www.`, 0 hosts estrangeiros**.

### 2.2 Classificação das 43.920 URLs

| Classe | URLs | % |
|---|---:|---:|
| Home do Índice | 1 | 0,002% |
| Metodologia | 1 | 0,002% |
| Hub de rankings de ativos | 1 | 0,002% |
| Hub de rankings de aberturas | 1 | 0,002% |
| UF (hub estadual) | 27 | 0,06% |
| Município (hub municipal) | 5.012 | 11,41% |
| Célula município × segmento | 23.566 | 53,66% |
| Ranking de aberturas por segmento e ano | 27 | 0,06% |
| Ranking de ativos nacional por segmento | 9 | 0,02% |
| Ranking de ativos por segmento e UF | 208 | 0,47% |
| Home dos EUA | 1 | 0,002% |
| Metodologia dos EUA | 1 | 0,002% |
| Estado dos EUA | 50 | 0,11% |
| Condado dos EUA | 2.627 | 5,98% |
| Célula condado × segmento (EUA) | 12.388 | 28,21% |
| **Total** | **43.920** | **100%** |

Distribuição dos 208 rankings de UF por segmento: restaurantes 26, hotéis 22, clínicas 23, profissionais de saúde 22, salões de beleza 24, academias 20, farmácias 24, oficinas 24, supermercados 23.

---

## 3. HTTP, robots, canônicas e conteúdo — amostra estratificada

Amostra de **242 páginas** cobrindo todas as classes (BR e EUA), com requisição direta ao HTML de produção em 2026-11-10:

| Verificação | Resultado |
|---|---|
| HTTP 200 | **242/242** |
| Redirecionamentos | 0 |
| `X-Robots-Tag` | 0 ocorrências |
| `meta robots` | `index, follow` em 242/242 |
| Canonical auto-referente (`https://filtraai.com`) | 242/242 |
| Erros de JSON-LD | 0 |
| Páginas sem `BreadcrumbList` | 0 |
| Último breadcrumb diferente da canonical | 0 |
| Páginas sem `<title>` ou `<h1>` | 0 |
| Títulos duplicados na amostra | 0 |
| Latência | p50 1,4 s · p95 6,3 s · máx. 11,8 s |

`robots.txt` de produção: `Allow: /`, `Disallow: /api/` apenas, 15 agentes de IA liberados individualmente (OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-SearchBot, Claude-User, DuckAssistBot, MistralAI-User, GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot, meta-externalagent, Amazonbot) e três declarações de sitemap. Nenhum shard depende de cache obsoleto do Worker: as respostas vieram de `render-origin`.

### 3.1 Conteúdo fino (medido, sem correção)

| Estrato | Palavras (mín./mediana) | Situação |
|---|---|---|
| Condado EUA | 255 / 278 | abaixo do que se espera de página própria, mas com dado real do Census CBP |
| Metodologia EUA | 392 | institucional, suficiente para o escopo |
| Estado EUA | 316 mínimo | aceitável |
| Célula EUA | 455 / 504 | aceitável |

Não houve remoção em massa de páginas: a auditoria de 2026-11-03 já concluiu que não há evidência nos dados para desindexar as células no piso do limiar.

### 3.2 Linkagem interna — cobertura pai → filho

| Origem | Cobertura |
|---|---|
| Home do Índice → 27 UFs + hub EUA | 28/28 |
| Hub EUA → 50 estados | 50/50 |
| `sp` → municípios | 635/635 |
| São Paulo (cidade) → segmentos | 9/9 |
| California → condados | 57/57 |
| Los Angeles County → segmentos | 9/9 |
| Hub de rankings → rankings nacionais | 9/9 |
| Hub de aberturas → rankings por ano | 27/27 |
| **UF → rankings de UF do estado** | **0/208 antes da correção** |
| **Ranking nacional → rankings de UF do segmento** | **0/208 antes da correção** |

Nenhum destino dos links internos amostrados apontou para URL fora do sitemap.

---

## 4. Google Search Console — acesso e limite

**Acesso nesta sessão: INDISPONÍVEL (BLOCKED).**

Evidência do bloqueio:

- `mcp_list` com filtro `search console` retornou **0 ferramentas**.
- Nenhuma variável de ambiente `GOOGLE*`, `GSC*` ou `SEARCH_CONSOLE*` existe no shell.
- Nenhum arquivo `.env` do frontend ou do Índice contém chaves com esses prefixos.
- Não há configuração local do `gcloud`.
- A sessão não possui credencial OAuth nem endpoint autenticado do Search Console.

Consequência: **nenhum número de indexação atual foi produzido nesta auditoria**. Todos os números de GSC citados abaixo são **históricos**, do documento `docs/AUDITORIA_GSC_INDEXACAO_2026-11-03.md` (medição de 2026-11-03), e não devem ser lidos como estado atual:

| Indicador histórico (2026-11-03) | Valor |
|---|---:|
| URLs reconhecidas no índice de sitemaps | 28.853 (retrato só do Brasil) |
| Última leitura do índice pelo Google | `2026-11-01T10:03:25Z` |
| Páginas do Índice com ao menos 1 impressão (2026-07-01→11-02) | 64 |
| Inspeções de URL `PASS` | 5 de 20 |
| `Discovered - currently not indexed` | 3 de 20 |
| `URL is unknown to Google` | 12 de 20 (5 BR + 7 EUA) |
| Impressões dos EUA | 0 |

As causas históricas registradas continuam coerentes com a evidência atual: (C1) o Google ainda não havia relido os shards com EUA; (C2) o hub dos EUA era órfão — corrigido no PR #204 e confirmado nesta auditoria (2 links de `/indice` para `/us` e 2 de volta); (C3) escala de 28.853 URLs descobertas de uma vez, com 32,6% das células entre 10 e 19 ativos.

**Para substituir `indisponível` por números reais é necessário:** acesso autorizado à propriedade `sc-domain:filtraai.com` e exportação do relatório **Indexação de páginas** (UI do GSC → Exportar), por estrato: `/uf`, `/uf/municipio`, `/uf/municipio/segmento`, `/rankings/...` e `/us/...`. A API de sitemaps não fornece esse relatório.

---

## 5. Auditoria AEO

| Verificação | Resultado | Evidência |
|---|---|---|
| Resposta direta no topo | **PASS** | `lead` com resultado, período, fonte e ressalva de escopo em rankings e hubs |
| Hierarquia de headings | **PASS** | H1 único e H2/H3 por seção nas 242 páginas amostradas |
| FAQ visível + `FAQPage` | **PASS** quando aplicável | home, UFs, municípios, células, rankings e metodologia; rankings usam FAQ visível sem JSON-LD (`semJsonLd`), evitando marcação redundante |
| `BreadcrumbList` única e coerente | **PASS** | uma por página, posições sequenciais, última = canonical, igual à trilha visível |
| `Dataset` com fonte e técnica | **PASS** | `isBasedOn` aponta para a Receita Federal; `measurementTechnique`, `temporalCoverage` e `spatialCoverage` presentes |
| `Dataset` sem `license` | **DECISÃO DOCUMENTADA** | não há licença explícita concedida; inventar URL seria pior. O GSC trata como aviso, não erro |
| Organization/WebSite autônomos | **OBSERVADO, NÃO ALTERADO** | a marca aparece como `creator`/`publisher` tipados dentro do `Dataset`, com `@id` `https://filtraai.com/#organization`. Criar um nó simplificado no Índice competiria com a entidade mais completa do site principal |
| Conteúdo visível × Schema.org | **PASS** | nenhuma promessa de monitoramento/importação de avaliações do Google; escopo negativo explícito |

Nenhuma marcação enganosa ou duplicada foi encontrada na amostra. O PR #204 já havia centralizado o breadcrumb em uma única fonte (`Migalhas` + `breadcrumb()`).

---

## 6. Auditoria GEO

| Dimensão | Situação | Evidência |
|---|---|---|
| Identidade da marca | **PASS** | `Filtra.AI` com `@id` estável; CNPJ e razão social no site principal; Índice usa a mesma entidade como criadora/publicadora |
| Conteúdo original e verificável | **PASS** | contagens mensais derivadas do CNPJ aberto, com competência e data de geração visíveis |
| Autoria e metodologia | **PASS** | `/metodologia` e `/us/methodology` explicam unidade, CNAE, janela, limiar e o que não é medido |
| Fontes citáveis | **PASS** | URLs da Receita Federal, Receita Aberta, suporte e Consumidor.gov.br na metodologia |
| Consistência institucional | **PASS** | linguagem de escopo alinhada entre home, metodologia, `llms.txt` e JSON-LD |
| Acessibilidade a rastreadores de IA | **PASS** | `robots.txt` libera 15 agentes; `llms.txt`, `llms-full.txt` e `llms-*.txt` respondem 200 |
| Medição de citação em IA | **NÃO EXECUTADA** | não há ferramenta de medição de citações nesta sessão; nenhum número foi inventado |

Acesso de rastreador, `llms.txt` e dados estruturados **não são prova de citação**. A taxa de citação continua sem medição, conforme o método reproduzível já descrito em `docs/SEO_AEO_GEO_BASELINE_2026-11-06.md`.

---

## 7. Correção implementada

### 7.1 Defeito comprovado

Os **208 rankings de ativos por UF** existiam no sitemap e respondiam 200, mas **não recebiam nenhum link interno**:

- 27 hubs de UF → **0/208** links para os rankings do próprio estado;
- 9 rankings nacionais → **0/208** links para os recortes estaduais do segmento;
- o único caminho de descoberta era o sitemap — o mesmo problema estrutural que o PR #204 corrigiu no hub dos EUA.

### 7.2 Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `indice/src/lib/rankings.ts` | novas funções `rankingsAtivosDaUF(sigla)` e `ufsComRankingsDoSegmento(seg)`, usando exatamente o predicado da rota e do sitemap (`rankingDoSegmento(...).length >= MIN_MUNICIPIOS_RANKING_UF`) |
| `indice/src/app/(br)/[uf]/page.tsx` | seção “Rankings de {estado} por segmento” com link para cada ranking de UF publicado |
| `indice/src/components/RankingPagina.tsx` | no ranking nacional, seção “Rankings por estado” com link para cada recorte estadual do segmento |
| `indice/scripts/test-seo.mjs` | dois gates novos no HTML renderizado: todo ranking de UF precisa ser linkado pelo hub do estado e pelo ranking nacional do segmento |

Nenhuma URL foi criada ou removida; nenhuma rota, CTA, canonical ou conteúdo comercial foi alterado.

### 7.3 Métricas antes/depois (medidas no build local, HTML renderizado)

| Métrica | Antes | Depois |
|---|---:|---:|
| Rankings de UF publicados | 208 | 208 |
| Rankings de UF linkados por hubs de UF | **0** | **208/208** |
| Rankings de UF linkados por rankings nacionais | **0** | **208/208** |
| Hubs de UF com ao menos um link de ranking | 0/27 | 26/27 (DF não tem ranking de UF: só Brasília) |
| Rankings nacionais com links para UFs | 0/9 | 9/9 |
| URLs no sitemap | 43.920 | 43.920 (inalterado) |

Distribuição de links por hub após a correção: AC 4, AL 9, AM 7, AP 1, BA 9, CE 9, DF 0, ES 9, GO 9, MA 9, MG 9, MS 9, MT 9, PA 9, PB 9, PE 9, PI 9, PR 9, RJ 9, RN 9, RO 8, RR 1, RS 9, SC 9, SE 8, SP 9, TO 8 — soma 208.

---

## 8. Testes e evidências

| Gate | Comando | Resultado |
|---|---|---|
| Typecheck | `indice: npm run typecheck` | **PASS** — exit 0, sem diagnósticos |
| Testes unitários | `indice: npm test` | **PASS** — 97/97, 0 falhas |
| Build | `indice: npm run build` | **PASS** — exit 0; rotas e revalidação inalteradas |
| Integração SEO | `indice: npm run test:seo` | **PASS** — 88.859 verificações, 0 falhas, exit 0; 43.920 indexáveis e 43.920 no sitemap |
| Sitemap estático | `indice: npm run sitemaps:static` + `--check` | **PASS** — artefato íntegro, 43.920 URLs em 5 shards |
| Links de UF — hub | gate novo no `test:seo` | **PASS** — `todo ranking de UF é linkado pelo hub do estado` |
| Links de UF — nacional | gate novo no `test:seo` | **PASS** — `todo ranking de UF é linkado pelo ranking nacional do segmento` |

**Transparência:** a primeira execução do `test:seo` terminou com `fetch failed` após 57 PASS, antes de qualquer teste novo, durante a fase de páginas da raiz. É a mesma falha transitória de servidor local já registrada em 2026-11-06. A repetição, sem alteração de código, executou a suíte completa e passou. O resultado registrado é o da execução completa (exit 0).

Gates do `frontend` não foram reexecutados porque nenhum arquivo do frontend foi alterado nesta correção.

---

## 9. Diagnóstico de indexação — o que está e o que não está provado

1. **As 43.920 URLs estão publicadas, são canônicas, retornam 200 e estão no sitemap.** Isso está medido.
2. **O Google não necessariamente indexou essas URLs.** A cobertura real exige o relatório *Indexação de páginas*; a API de sitemaps não mede indexação (`indexed=0` é campo depreciado).
3. **A descoberta interna melhorou:** o hub dos EUA está ligado ao hub brasileiro (PR #204) e os 208 rankings de UF agora têm dois caminhos internos.
4. **A escala e o conteúdo fino continuam sendo a restrição estrutural:** 23.566 células + 12.388 células EUA, muitas no piso de 10 ativos. Nenhuma remoção em massa foi feita.
5. **Não há bloqueio técnico comprovado:** robots libera, não há `noindex`, canonical é auto-referente, não há erro de renderização e todos os shards respondem.

---

## 10. Pendências externas (delimitadas)

| # | Pendência | Depende de | Critério de conclusão |
|---|---|---|---|
| 1 | Medir indexação real por estrato | acesso autorizado ao GSC e exportação da *Indexação de páginas* | tabela por estrato somando 43.920, sem `indisponível` |
| 2 | Confirmar releitura do índice central com 43.920 URLs | GSC (reenvio já autorizado apenas se houver aprovação explícita) | `submitted=43920`, `errors=0`, `lastDownloaded` posterior |
| 3 | Verificar em produção os novos links de UF | deploy desta correção (não autorizado nesta sessão) | `curl` dos hubs contendo os links e inspeção de URL sem `URL is unknown to Google` |
| 4 | Reconciliar 1 `<loc>` extra em `/sitemap.xml` (107 × 106) | decisão de escopo do site principal | contagem publicada = `submitted` |
| 5 | Avaliar `hreflang` pt-BR/en entre `/indice` e `/indice/us` | decisão editorial | alternates recíprocos, sem canônica cruzada |
| 6 | Medir citação em IA | execução do método de 5 engines | taxa de citação e precisão por janela, com captura datada |

Itens 4–6 são melhorias de baixa prioridade; não bloqueiam a correção atual.

---

## 11. Publicação

- Branch de correção: `audit/indice-indexacao-aeo-geo`.
- PR para `main`: aberto **sem merge**.
- Deploy em Render, Cloudflare ou qualquer ambiente de produção: **não executado**.
- Configurações de Render/Cloudflare: **não alteradas**.
- Search Console: **não acessado**.

A correção só pode ser considerada publicada depois de revisão do PR, deploy autorizado e verificação dos links no HTML de produção.
